"""
recruitment/tasks.py

Celery async tasks for SafeNet AI Recruitment Platform.

Tasks run in the background so that:
  - HTTP requests return immediately (never block on AI or file I/O)
  - 50+ resume evaluations don't time out the request thread
  - Email notifications don't slow down the UI
"""
import os
import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger('recruitment')


@shared_task(
    bind=True,
    max_retries=3,
    retry_backoff=True,
    default_retry_delay=30,
    name='recruitment.tasks.parse_and_profile_resume',
)
def parse_and_profile_resume(self, resume_id: int) -> dict:
    """
    Parse a resume file and store all extracted intelligence in the DB.

    Steps:
        1. Load resume record (file_location)
        2. Extract text (PDF/DOCX)
        3. Extract skills against skill_master
        4. Detect education level
        5. Estimate experience years
        6. Extract certifications
        7. Write all to resume table (parse_status → 'done')

    Called by: upload_candidate_resume() view after successful file save.
    """
    from recruitment.repositories.resume_repo import resume_repo
    from recruitment.services.resume_parser import resume_parser

    logger.info(f"[Task] parse_and_profile_resume: resume_id={resume_id}")

    try:
        resume = resume_repo.find_by_id(resume_id)
        if not resume:
            logger.error(f"Resume {resume_id} not found in DB")
            return {'status': 'error', 'message': 'Resume not found'}

        file_path = os.path.join(settings.MEDIA_ROOT, resume['file_location'])

        # Extract raw text
        text = resume_parser.extract_text(file_path)
        if not text:
            logger.warning(f"No text extracted from resume {resume_id}: {file_path}")
            resume_repo.set_parse_failed(resume_id)
            return {'status': 'failed', 'message': 'No text extracted'}

        # Extract intelligence
        known_skills = resume_repo.get_all_skill_names()
        extracted_skills = resume_parser.extract_skills_from_text(text, known_skills)
        education = resume_parser.detect_education(text)
        experience_years = resume_parser.extract_experience_years(text)
        certifications = resume_parser.extract_certifications(text)
        has_projects = resume_parser.has_projects_section(text)

        # Persist parsed profile
        resume_repo.update_parsed_profile(
            resume_id=resume_id,
            parsed_text=text[:65000],   # LONGTEXT safe cap
            extracted_skills=extracted_skills,
            education_detected=education,
            experience_years=experience_years,
            certifications=certifications,
            projects=['Projects section detected'] if has_projects else [],
        )

        logger.info(
            f"[Task] Parsed resume {resume_id}: "
            f"skills={len(extracted_skills)}, edu={education}, "
            f"exp={experience_years}yr, certs={len(certifications)}"
        )

        return {
            'status': 'done',
            'resume_id': resume_id,
            'skills_count': len(extracted_skills),
            'education': education,
            'experience_years': experience_years,
        }

    except Exception as exc:
        logger.error(f"[Task] parse_and_profile_resume failed for {resume_id}: {exc}")
        try:
            from recruitment.repositories.resume_repo import resume_repo as rr
            rr.set_parse_failed(resume_id)
        except Exception:
            pass
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    max_retries=3,
    retry_backoff=True,
    default_retry_delay=60,
    name='recruitment.tasks.run_ai_evaluation',
)
def run_ai_evaluation(
    self,
    resume_id: int,
    requirement_id: int,
    user_id: int,
) -> dict:
    """
    Evaluate a single resume against a job requirement.

    Steps:
        1. Load resume profile from DB (parsed intelligence)
        2. Load job requirements from DB (skills, education, experience)
        3. Run deterministic ScoringEngine → real score
        4. Call AIService.explain_candidate() → summary, strengths, concerns
        5. Write evaluation to resume_job_map
        6. Log action to audit_log

    Called by: evaluate_with_ai() view (one task dispatched per resume).
    """
    from recruitment.repositories.resume_repo import resume_repo
    from recruitment.repositories.candidate_repo import candidate_repo
    from recruitment.services.scoring_engine import scoring_engine
    from recruitment.services.ai_service import get_ai_service
    from recruitment.services.audit_service import audit_service

    logger.info(
        f"[Task] run_ai_evaluation: resume={resume_id} req={requirement_id} user={user_id}"
    )

    try:
        # 1. Load resume profile
        resume = resume_repo.find_by_id(resume_id)
        if not resume:
            return {'status': 'error', 'message': f'Resume {resume_id} not found'}

        if resume['parse_status'] != 'done':
            return {'status': 'skipped', 'message': 'Resume not yet parsed'}

        # 2. Load job requirements
        from django.db import connection
        with connection.cursor() as cursor:
            # Get position info
            cursor.execute("""
                SELECT pm.position_name, jr.experience_range
                FROM job_requirement jr
                JOIN position_master pm ON jr.position_id = pm.position_id
                WHERE jr.requirement_id = %s
            """, [requirement_id])
            job_row = cursor.fetchone()

            if not job_row:
                return {'status': 'error', 'message': f'Requirement {requirement_id} not found'}

            position_name, experience_range = job_row

            # Get required skills
            cursor.execute("""
                SELECT sm.skill_name
                FROM job_skill js
                JOIN skill_master sm ON js.skill_id = sm.skill_id
                WHERE js.requirement_id = %s
            """, [requirement_id])
            required_skills = [r[0] for r in cursor.fetchall()]

            # Get required education
            cursor.execute("""
                SELECT em.education_name
                FROM job_education je
                JOIN education_master em ON je.education_id = em.education_id
                WHERE je.requirement_id = %s
            """, [requirement_id])
            required_education = [r[0] for r in cursor.fetchall()]

        job_requirements = {
            'position':           position_name,
            'experience_range':   experience_range,
            'required_skills':    required_skills,
            'required_education': required_education,
        }

        # 3. Deterministic scoring
        resume_profile = {
            'extracted_skills':   resume['extracted_skills'],
            'experience_years':   resume['experience_years'],
            'education_detected': resume['education_detected'],
        }
        score_result = scoring_engine.score(resume_profile, job_requirements)

        # 4. AI explanation (non-blocking — graceful fallback if API unavailable)
        ai_summary = ''
        ai_service = get_ai_service()
        if ai_service:
            try:
                explanation = ai_service.explain_candidate(
                    resume_text=resume['parsed_text'] or '',
                    job_requirements=job_requirements,
                    score_breakdown=score_result,
                )
                ai_summary = explanation.get('summary', '')
                # Store full explanation in skill_match_data for the Drawer
                score_result['ai_explanation'] = explanation
            except Exception as ai_err:
                logger.warning(f"AI explanation failed for resume {resume_id}: {ai_err}")
                # Evaluation continues — score is deterministic, explanation is optional

        # 5. Write to DB
        candidate_repo.write_evaluation(
            resume_id=resume_id,
            requirement_id=requirement_id,
            score=score_result['score'],
            matched_skills=score_result['matched_skills'],
            missing_skills=score_result['missing_skills'],
            skill_match_data=score_result,
            ai_summary=ai_summary,
            evaluated_by=user_id,
        )

        # 6. Audit log
        audit_service.log(
            action='evaluate',
            actor_id=user_id,
            target_type='resume',
            target_id=resume_id,
            details={
                'requirement_id': requirement_id,
                'score': score_result['score'],
                'matched_count': len(score_result['matched_skills']),
                'missing_count': len(score_result['missing_skills']),
            }
        )

        logger.info(
            f"[Task] Evaluated resume {resume_id} → score={score_result['score']} "
            f"matched={len(score_result['matched_skills'])} "
            f"missing={len(score_result['missing_skills'])}"
        )

        return {
            'status': 'done',
            'resume_id': resume_id,
            'score': score_result['score'],
        }

    except Exception as exc:
        logger.error(
            f"[Task] run_ai_evaluation failed for resume={resume_id} req={requirement_id}: {exc}"
        )
        raise self.retry(exc=exc)


@shared_task(name='recruitment.tasks.send_interview_notification')
def send_interview_notification(candidate_email: str, schedule_details: dict) -> dict:
    """
    Send an interview invitation email to a candidate.
    Placeholder: configure EMAIL_* settings in .env to activate.
    """
    logger.info(
        f"[Task] send_interview_notification: email={candidate_email} "
        f"datetime={schedule_details.get('interview_datetime')}"
    )
    # TODO: Implement with Django's send_mail() once SMTP is configured
    return {'status': 'queued', 'email': candidate_email}


@shared_task(name='recruitment.tasks.cleanup_abandoned_exams')
def cleanup_abandoned_exams() -> dict:
    """
    Find all exam sessions that are 'in_progress' and past their expires_at,
    and mark them as 'submitted'. Logs 'exam_abandoned' if no answers were 
    submitted, or 'exam_timeout' if some answers were submitted.
    """
    import datetime
    from django.utils import timezone
    from django.db import connection
    from recruitment.services.audit_service import audit_service
    
    now = timezone.now()
    with connection.cursor() as cursor:
        # Find expired sessions that are still in_progress
        cursor.execute("""
            SELECT session_id, user_id, resume_id, requirement_id FROM exam_session
            WHERE status = 'in_progress' AND expires_at <= %s
        """, [now])
        expired_sessions = cursor.fetchall()
        
        cleaned_count = 0
        for session_id, user_id, resume_id, requirement_id in expired_sessions:
            # Check if they submitted any answers
            cursor.execute("SELECT COUNT(*) FROM exam_answer WHERE session_id = %s", [session_id])
            ans_count = cursor.fetchone()[0]
            
            # Determine action/status
            action = 'exam_timeout' if ans_count > 0 else 'exam_abandoned'
            
            # Mark session as completed
            cursor.execute("""
                UPDATE exam_session 
                SET status = 'submitted', completed_at = expires_at, updated_at = NOW() 
                WHERE session_id = %s
            """, [session_id])
            
            # Update candidate pipeline status
            cursor.execute("""
                UPDATE resume_job_map 
                SET status = 'exam_submitted', updated_at = NOW() 
                WHERE resume_id = %s AND requirement_id = %s
            """, [resume_id, requirement_id])
            
            # Log audit log
            audit_service.log(
                action=action,
                actor_id=user_id,
                target_type='exam_session',
                target_id=session_id,
                details={'message': f'Stale exam session cleaned up by background task. Answers found: {ans_count}'}
            )
            cleaned_count += 1
            
    return {'cleaned_count': cleaned_count}

