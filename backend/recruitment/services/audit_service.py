"""
recruitment/services/audit_service.py

Writes audit log entries for all significant actions.
Powers the activity timeline in the Candidate Intelligence Drawer.
"""
import logging
import json
from django.db import connection

logger = logging.getLogger('recruitment')


class AuditService:
    """
    Records every significant action in the audit_log table.
    Actions include: shortlist, approve, reject, evaluate, schedule_interview,
    finalise, update_score, generate_questions, etc.
    """

    def log(
        self,
        action: str,
        actor_id: int,
        target_type: str = None,
        target_id: int = None,
        details: dict = None,
    ) -> None:
        """
        Insert an audit log entry.

        Args:
            action:      e.g. 'shortlist', 'approve', 'reject', 'evaluate'
            actor_id:    userid of the person who performed the action
            target_type: e.g. 'resume', 'job_requirement', 'interview'
            target_id:   PK of the target entity
            details:     Optional extra data (JSON-serialisable dict)
        """
        try:
            details_json = json.dumps(details) if details else None
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO audit_log
                        (action, actor_id, target_type, target_id, details)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    [action, actor_id, target_type, target_id, details_json]
                )
            logger.debug(
                f"Audit log: action={action} actor={actor_id} "
                f"target={target_type}:{target_id}"
            )
        except Exception as e:
            # Never let audit logging crash the main request
            logger.error(f"Failed to write audit log: {e}")

    def get_timeline(
        self,
        target_type: str,
        target_id: int,
        limit: int = 50
    ) -> list[dict]:
        """
        Retrieve the audit timeline for a given entity.
        Used by the CandidateDrawer activity timeline.
        """
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT
                        al.log_id,
                        al.action,
                        al.actor_id,
                        u.first_name,
                        u.last_name,
                        al.details,
                        al.created_at
                    FROM audit_log al
                    LEFT JOIN users u ON al.actor_id = u.userid
                    WHERE al.target_type = %s AND al.target_id = %s
                    ORDER BY al.created_at DESC
                    LIMIT %s
                    """,
                    [target_type, target_id, limit]
                )
                rows = cursor.fetchall()

            return [
                {
                    'log_id':     row[0],
                    'action':     row[1],
                    'actor_id':   row[2],
                    'actor_name': f"{row[3] or ''} {row[4] or ''}".strip() or 'System',
                    'details':    json.loads(row[5]) if row[5] else {},
                    'timestamp':  row[6].isoformat() if row[6] else None,
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Failed to fetch audit timeline: {e}")
            return []


# Singleton instance
audit_service = AuditService()
