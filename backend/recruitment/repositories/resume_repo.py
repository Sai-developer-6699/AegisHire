"""
recruitment/repositories/resume_repo.py

All SQL operations related to the resume table.
Provides a clean, testable abstraction over raw SQL.
"""
import json
import logging
from django.db import connection

logger = logging.getLogger('recruitment')


class ResumeRepository:

    def find_by_id(self, resume_id: int) -> dict | None:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT resume_id, resume_name, email, phone_number,
                       file_location, uploaded_at,
                       parsed_text, extracted_skills,
                       education_detected, experience_years,
                       certifications, projects, parse_status
                FROM resume WHERE resume_id = %s
            """, [resume_id])
            row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_dict(row)

    def find_by_email_or_hash(self, email: str, content_hash: str) -> dict | None:
        """Check for duplicate candidates before inserting."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT resume_id, resume_name, email
                FROM resume
                WHERE email = %s OR content_hash = %s
                LIMIT 1
            """, [email, content_hash])
            row = cursor.fetchone()
        if not row:
            return None
        return {'resume_id': row[0], 'resume_name': row[1], 'email': row[2]}

    def update_parsed_profile(
        self,
        resume_id: int,
        parsed_text: str,
        extracted_skills: list,
        education_detected: str,
        experience_years: float,
        certifications: list = None,
        projects: list = None,
        content_hash: str = None,
    ) -> None:
        """Store parsed resume intelligence. Called once after upload."""
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE resume SET
                    parsed_text       = %s,
                    extracted_skills  = %s,
                    education_detected = %s,
                    experience_years  = %s,
                    certifications    = %s,
                    projects          = %s,
                    content_hash      = %s,
                    parse_status      = 'done'
                WHERE resume_id = %s
            """, [
                parsed_text,
                json.dumps(extracted_skills),
                education_detected,
                experience_years,
                json.dumps(certifications or []),
                json.dumps(projects or []),
                content_hash,
                resume_id,
            ])

    def set_parse_failed(self, resume_id: int) -> None:
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE resume SET parse_status = 'failed' WHERE resume_id = %s",
                [resume_id]
            )

    def list_pending_evaluation(self, requirement_id: int, limit: int = 50) -> list[dict]:
        """Return resumes that have been parsed but not yet evaluated for this requirement."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT r.resume_id, r.resume_name, r.file_location,
                       r.parsed_text, r.extracted_skills,
                       r.education_detected, r.experience_years
                FROM resume r
                WHERE r.parse_status = 'done'
                  AND r.is_active = TRUE
                  AND NOT EXISTS (
                    SELECT 1 FROM resume_job_map m
                    WHERE m.resume_id = r.resume_id AND m.requirement_id = %s
                  )
                LIMIT %s
            """, [requirement_id, limit])
            rows = cursor.fetchall()

        return [
            {
                'resume_id':          row[0],
                'resume_name':        row[1],
                'file_location':      row[2],
                'parsed_text':        row[3] or '',
                'extracted_skills':   json.loads(row[4]) if row[4] else [],
                'education_detected': row[5] or '',
                'experience_years':   float(row[6]) if row[6] else 0.0,
            }
            for row in rows
        ]

    def get_all_skill_names(self) -> list[str]:
        """Return all skill names from skill_master for use in skill extraction."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT skill_name FROM skill_master")
            return [row[0] for row in cursor.fetchall()]

    def _row_to_dict(self, row: tuple) -> dict:
        return {
            'resume_id':          row[0],
            'resume_name':        row[1],
            'email':              row[2],
            'phone_number':       row[3],
            'file_location':      row[4],
            'uploaded_at':        row[5].isoformat() if row[5] else None,
            'parsed_text':        row[6],
            'extracted_skills':   json.loads(row[7]) if row[7] else [],
            'education_detected': row[8],
            'experience_years':   float(row[9]) if row[9] else None,
            'certifications':     json.loads(row[10]) if row[10] else [],
            'projects':           json.loads(row[11]) if row[11] else [],
            'parse_status':       row[12],
        }


resume_repo = ResumeRepository()
