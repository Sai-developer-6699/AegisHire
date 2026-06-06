"""
recruitment/services/search_service.py

Candidate search engine — fully deterministic, no AI required.
Searches the parsed resume intelligence store built in Phase 3.

A recruiter can query by:
    - Required skills (JSON_CONTAINS match)
    - Experience range (years between min/max)
    - Education level
    - Optional: restrict to a specific job's evaluated pool

Results are ranked by skill match percentage (highest first).
"""
import logging
from django.db import connection

logger = logging.getLogger('recruitment')


class CandidateSearchService:
    """
    Searches parsed candidate profiles stored in the resume table.
    All filtering is done in SQL; ranking is done in Python.
    """

    def search(
        self,
        skills: list[str] = None,
        experience_min: float = None,
        experience_max: float = None,
        education: str = None,
        requirement_id: int = None,
        requirement_ids: list[int] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """
        Search candidates across the intelligence store.

        Returns:
            {
                'results': list[dict],  # ranked by match_pct desc
                'total':   int,
            }

        Each result dict:
            {
                resume_id, name, email, experience_years, education_detected,
                extracted_skills, parse_status, score (if evaluated),
                match_pct (% of requested skills found)
            }
        """
        skills = skills or []
        conditions = ['r.parse_status = %s']
        params = ['done']

        # Experience range filter
        if experience_min is not None:
            conditions.append('r.experience_years >= %s')
            params.append(experience_min)
        if experience_max is not None:
            conditions.append('r.experience_years <= %s')
            params.append(experience_max)

        # Education filter (case-insensitive partial match)
        if education:
            conditions.append('r.education_detected LIKE %s')
            params.append(f'%{education}%')

        # Restrict to a specific job's evaluated pool or list of allowed requirements
        if requirement_id:
            conditions.append(
                'EXISTS (SELECT 1 FROM resume_job_map rjm '
                'WHERE rjm.resume_id = r.resume_id '
                'AND rjm.requirement_id = %s)'
            )
            params.append(requirement_id)
        elif requirement_ids:
            placeholders = ','.join(['%s'] * len(requirement_ids))
            conditions.append(
                f'EXISTS (SELECT 1 FROM resume_job_map rjm '
                f'WHERE rjm.resume_id = r.resume_id '
                f'AND rjm.requirement_id IN ({placeholders}))'
            )
            params.extend(requirement_ids)

        where_clause = ' AND '.join(conditions)

        # Skill filtering: use JSON_CONTAINS for each requested skill
        # We apply this as a HAVING clause in Python for flexibility
        # (MySQL JSON_CONTAINS can be used but is less flexible for partial matches)
        skill_conditions = []
        for skill in skills:
            skill_conditions.append(
                f"JSON_CONTAINS(LOWER(JSON_UNQUOTE(r.extracted_skills)), JSON_ARRAY(LOWER(%s)))"
            )
            params.append(skill)

        if skill_conditions:
            where_clause += ' AND (' + ' OR '.join(skill_conditions) + ')'

        join_on_clause = ''
        if requirement_id:
            join_on_clause = 'AND rjm.requirement_id = %s'
        elif requirement_ids:
            placeholders = ','.join(['%s'] * len(requirement_ids))
            join_on_clause = f'AND rjm.requirement_id IN ({placeholders})'

        query = f"""
            SELECT
                r.resume_id,
                r.resume_name,
                r.email,
                r.experience_years,
                r.education_detected,
                r.extracted_skills,
                r.parse_status,
                rjm.score,
                rjm.matched_skills,
                rjm.missing_skills
            FROM resume r
            LEFT JOIN resume_job_map rjm
                ON r.resume_id = rjm.resume_id
                {join_on_clause}
            WHERE {where_clause}
            ORDER BY rjm.score DESC, r.experience_years DESC
            LIMIT %s OFFSET %s
        """

        if requirement_id:
            all_params = [requirement_id] + params + [limit, offset]
        elif requirement_ids:
            all_params = requirement_ids + params + [limit, offset]
        else:
            all_params = params + [limit, offset]

        try:

            with connection.cursor() as cursor:
                cursor.execute(query, all_params)
                rows = cursor.fetchall()

            results = []
            for row in rows:
                import json
                extracted = json.loads(row[5]) if row[5] else []
                matched_from_query = json.loads(row[8]) if row[8] else []
                missing_from_query = json.loads(row[9]) if row[9] else []

                # Compute match percentage for the requested skills
                if skills:
                    candidate_lower = {s.lower() for s in extracted}
                    matched_requested = [s for s in skills if s.lower() in candidate_lower]
                    match_pct = round(len(matched_requested) / len(skills) * 100, 1)
                else:
                    matched_requested = []
                    match_pct = 100.0 if extracted else 0.0

                results.append({
                    'resume_id':          row[0],
                    'name':               row[1],
                    'email':              row[2],
                    'experience_years':   float(row[3]) if row[3] else 0.0,
                    'education_detected': row[4] or '',
                    'extracted_skills':   extracted,
                    'parse_status':       row[6],
                    'score':              float(row[7]) if row[7] else None,
                    'matched_skills':     matched_from_query or matched_requested,
                    'missing_skills':     missing_from_query,
                    'match_pct':          match_pct,
                })

            # Sort by match_pct desc, then score desc
            results.sort(key=lambda x: (x['match_pct'], x['score'] or 0), reverse=True)

            return {'results': results, 'total': len(results)}

        except Exception as e:
            logger.error(f"Candidate search failed: {e}")
            return {'results': [], 'total': 0, 'error': str(e)}


# Singleton instance
search_service = CandidateSearchService()
