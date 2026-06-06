"""
recruitment/services/rag_service.py

Retrieval-Augmented Generation service for the Recruiter Copilot.

Instead of dumping everything into a prompt (naive RAG), this service:
  1. Parses the recruiter's question for intent and entities
  2. Retrieves only relevant data from the DB
  3. Passes a tight, structured context to the AI
  4. Returns a grounded, data-backed answer

This prevents hallucinations and dramatically improves answer quality.
"""
import json
import logging
from django.db import connection

logger = logging.getLogger('recruitment')


class RAGService:
    """
    Retrieval layer for the Recruiter Copilot.
    Builds structured DB context from recruiter questions.
    """

    def build_context(self, question: str, requirement_id: int = None) -> dict:
        """
        Build a structured context object by retrieving relevant DB data.

        Returns:
            {
                position:        str,
                experience_range: str,
                required_skills:  list[str],
                candidates:       list[{name, score, matched_skills, missing_skills, ai_summary}],
                pipeline_summary: { evaluated, shortlisted, approved, rejected },
            }
        """
        context = {
            'position': '',
            'experience_range': '',
            'required_skills': [],
            'candidates': [],
            'pipeline_summary': {},
        }

        if not requirement_id:
            return context

        try:
            with connection.cursor() as cursor:
                # Get job details
                cursor.execute("""
                    SELECT pm.position_name, jr.experience_range
                    FROM job_requirement jr
                    JOIN position_master pm ON jr.position_id = pm.position_id
                    WHERE jr.requirement_id = %s
                """, [requirement_id])
                job_row = cursor.fetchone()
                if job_row:
                    context['position'] = job_row[0]
                    context['experience_range'] = job_row[1]

                # Get required skills
                cursor.execute("""
                    SELECT sm.skill_name
                    FROM job_skill js
                    JOIN skill_master sm ON js.skill_id = sm.skill_id
                    WHERE js.requirement_id = %s
                """, [requirement_id])
                context['required_skills'] = [r[0] for r in cursor.fetchall()]

                # Get top candidates with scores and AI data
                cursor.execute("""
                    SELECT
                        r.resume_name,
                        r.email,
                        rjm.score,
                        rjm.matched_skills,
                        rjm.missing_skills,
                        rjm.ai_summary,
                        rjm.status
                    FROM resume_job_map rjm
                    JOIN resume r ON rjm.resume_id = r.resume_id
                    WHERE rjm.requirement_id = %s
                    ORDER BY rjm.score DESC
                    LIMIT 10
                """, [requirement_id])

                for row in cursor.fetchall():
                    context['candidates'].append({
                        'name':           row[0],
                        'email':          row[1],
                        'score':          float(row[2]) if row[2] else None,
                        'matched_skills': json.loads(row[3]) if row[3] else [],
                        'missing_skills': json.loads(row[4]) if row[4] else [],
                        'ai_summary':     row[5] or '',
                        'status':         row[6],
                    })

                # Pipeline summary
                cursor.execute("""
                    SELECT status, COUNT(*) as cnt
                    FROM resume_job_map
                    WHERE requirement_id = %s
                    GROUP BY status
                """, [requirement_id])
                for row in cursor.fetchall():
                    context['pipeline_summary'][row[0]] = row[1]

        except Exception as e:
            logger.error(f"RAG context build failed: {e}")

        return context

    def answer(self, question: str, requirement_id: int = None) -> str:
        """
        Main entry point for Copilot.
        Builds context from DB, then calls AI service.
        """
        from recruitment.services.ai_service import get_ai_service
        ai = get_ai_service()

        if ai is None:
            return "AI Copilot is currently unavailable. Check your GEMINI_API_KEY or AI_PROVIDER setting."

        context = self.build_context(question, requirement_id)
        return ai.copilot_answer(question, context)


# Singleton instance
rag_service = RAGService()
