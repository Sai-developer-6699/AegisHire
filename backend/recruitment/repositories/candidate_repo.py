"""
recruitment/repositories/candidate_repo.py

All SQL operations related to resume_job_map (candidate evaluation state).
"""
import json
import logging
from django.db import connection

logger = logging.getLogger('recruitment')


class CandidateRepository:

    def get_ranked(self, requirement_id: int) -> list[dict]:
        """Return all evaluated candidates for a requirement, sorted by score desc."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    rjm.map_id,
                    r.resume_id,
                    r.resume_name,
                    r.email,
                    rjm.score,
                    rjm.status,
                    rjm.matched_skills,
                    rjm.missing_skills,
                    rjm.ai_summary,
                    r.experience_years,
                    r.education_detected,
                    r.file_location
                FROM resume_job_map rjm
                JOIN resume r ON rjm.resume_id = r.resume_id
                WHERE rjm.requirement_id = %s
                ORDER BY rjm.score DESC
            """, [requirement_id])
            rows = cursor.fetchall()

        return [self._row_to_dict(row) for row in rows]

    def get_ai_details(self, resume_id: int, requirement_id: int) -> dict | None:
        """Return AI explanation details for a specific candidate+job combination."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    rjm.score,
                    rjm.matched_skills,
                    rjm.missing_skills,
                    rjm.ai_summary,
                    rjm.skill_match_data,
                    rjm.status,
                    r.experience_years,
                    r.education_detected,
                    r.extracted_skills
                FROM resume_job_map rjm
                JOIN resume r ON r.resume_id = rjm.resume_id
                WHERE rjm.resume_id = %s AND rjm.requirement_id = %s
                LIMIT 1
            """, [resume_id, requirement_id])
            row = cursor.fetchone()

        if not row:
            return None

        return {
            'score':             float(row[0]) if row[0] else None,
            'matched_skills':    json.loads(row[1]) if row[1] else [],
            'missing_skills':    json.loads(row[2]) if row[2] else [],
            'ai_summary':        row[3] or '',
            'skill_match_data':  json.loads(row[4]) if row[4] else {},
            'status':            row[5],
            'experience_years':  float(row[6]) if row[6] else None,
            'education_detected': row[7] or '',
            'extracted_skills':  json.loads(row[8]) if row[8] else [],
        }

    def update_status(self, map_id: int, new_status: str, actor_id: int = None) -> None:
        with connection.cursor() as cursor:
            cursor.execute("SELECT status FROM resume_job_map WHERE map_id = %s", [map_id])
            row = cursor.fetchone()
            role_id = None
            if row:
                current_status = row[0]
                if actor_id:
                    cursor.execute("SELECT roleid FROM users WHERE userid = %s", [actor_id])
                    role_row = cursor.fetchone()
                    if role_row:
                        role_id = role_row[0]
                from recruitment.services.ownership_service import OwnershipService
                ownership = OwnershipService()
                is_valid, err_msg = ownership.validate_transition(current_status, new_status, role_id=role_id)
                if not is_valid:
                    if err_msg and "Finalized" in err_msg:
                        raise PermissionError(err_msg)
                    raise ValueError(err_msg or f"Invalid status transition from {current_status} to {new_status}")

            cursor.execute("""
                UPDATE resume_job_map
                SET status = %s, updated_at = NOW()
                WHERE map_id = %s
            """, [new_status, map_id])


    def write_evaluation(
        self,
        resume_id: int,
        requirement_id: int,
        score: float,
        matched_skills: list,
        missing_skills: list,
        skill_match_data: dict,
        ai_summary: str,
        evaluated_by: int,
    ) -> None:
        """Insert or update evaluation result for a resume+job combination."""
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO resume_job_map
                    (resume_id, requirement_id, score, status, evaluated_by,
                     matched_skills, missing_skills, skill_match_data, ai_summary)
                VALUES (%s, %s, %s, 'evaluated', %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    score             = VALUES(score),
                    status            = VALUES(status),
                    matched_skills    = VALUES(matched_skills),
                    missing_skills    = VALUES(missing_skills),
                    skill_match_data  = VALUES(skill_match_data),
                    ai_summary        = VALUES(ai_summary),
                    updated_at        = NOW()
            """, [
                resume_id, requirement_id, score, evaluated_by,
                json.dumps(matched_skills),
                json.dumps(missing_skills),
                json.dumps(skill_match_data),
                ai_summary,
            ])
            cursor.execute(
                "UPDATE resume SET is_active = FALSE WHERE resume_id = %s",
                [resume_id]
            )

    def get_evaluation_progress(self, requirement_id: int) -> dict:
        """Return progress counts for the evaluation status endpoint."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT status, COUNT(*) FROM resume_job_map
                WHERE requirement_id = %s
                GROUP BY status
            """, [requirement_id])
            status_counts = dict(cursor.fetchall())

            cursor.execute("""
                SELECT COUNT(*) FROM resume
                WHERE is_active = TRUE
                  AND parse_status = 'done'
                  AND NOT EXISTS (
                    SELECT 1 FROM resume_job_map m
                    WHERE m.resume_id = resume.resume_id
                      AND m.requirement_id = %s
                  )
            """, [requirement_id])
            pending = cursor.fetchone()[0]

        evaluated = status_counts.get('evaluated', 0)
        failed = status_counts.get('failed', 0)
        total = sum(status_counts.values()) + pending

        return {
            'total':        total,
            'evaluated':    evaluated,
            'pending':      pending,
            'failed':       failed,
            'progress_pct': round(evaluated / total * 100, 1) if total > 0 else 0,
        }

    def _row_to_dict(self, row: tuple) -> dict:
        return {
            'map_id':            row[0],
            'resume_id':         row[1],
            'name':              row[2],
            'email':             row[3],
            'score':             float(row[4]) if row[4] else None,
            'status':            row[5],
            'matched_skills':    json.loads(row[6]) if row[6] else [],
            'missing_skills':    json.loads(row[7]) if row[7] else [],
            'ai_summary':        row[8] or '',
            'experience_years':  float(row[9]) if row[9] else None,
            'education_detected': row[10] or '',
            'file_location':     row[11],
        }


candidate_repo = CandidateRepository()
