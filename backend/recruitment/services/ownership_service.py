from django.db import connection
import logging

logger = logging.getLogger('recruitment')

class OwnershipService:
    """Centralized object-level authorization for all ATS entities."""

    def can_view_requirement(self, user_id, role_id, requirement_id):
        """
        Admin (1): always True
        Manager (2): True if created_by = user_id
        HR (3): True if assigned_to = user_id OR assigned_to IS NULL
        """
        if role_id == 1:
            return True
            
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT created_by, assigned_to FROM job_requirement WHERE requirement_id = %s",
                [requirement_id]
            )
            row = cursor.fetchone()
            if not row:
                return False
            created_by, assigned_to = row
            
            if role_id == 2:  # Manager
                return created_by == user_id
            elif role_id == 3:  # HR
                return assigned_to == user_id or assigned_to is None
                
        return False

    def can_modify_requirement(self, user_id, role_id, requirement_id):
        """
        Same as can_view, but assigned_to IS NULL returns False (must claim before modifying).
        For Managers: created_by = user_id
        For Admins: always True
        """
        if role_id == 1:
            return True
            
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT created_by, assigned_to FROM job_requirement WHERE requirement_id = %s",
                [requirement_id]
            )
            row = cursor.fetchone()
            if not row:
                return False
            created_by, assigned_to = row
            
            if role_id == 2:  # Manager
                return created_by == user_id
            elif role_id == 3:  # HR
                return assigned_to == user_id  # Cannot modify if not claimed!
                
        return False

    def can_view_resume(self, user_id, role_id, resume_id):
        """Checks if the resume belongs to a requirement the user can view."""
        if role_id == 1:
            return True
            
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT DISTINCT requirement_id FROM resume_job_map WHERE resume_id = %s",
                [resume_id]
            )
            req_ids = [row[0] for row in cursor.fetchall()]
            if not req_ids:
                # If there are no maps yet, check if the resume was created by the user or if HR can see it
                cursor.execute("SELECT created_by FROM resume WHERE resume_id = %s", [resume_id])
                row = cursor.fetchone()
                if not row:
                    return False
                created_by = row[0]
                if role_id == 3:  # HR can view all unmapped resumes
                    return True
                return created_by == user_id

            # If it is mapped, the user must be able to view at least one of the requirements
            for req_id in req_ids:
                if self.can_view_requirement(user_id, role_id, req_id):
                    return True
        return False

    def can_schedule_interview(self, user_id, role_id, map_id):
        """Checks map_id → requirement_id → assigned_to ownership chain."""
        if role_id == 1:
            return True
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT requirement_id FROM resume_job_map WHERE map_id = %s",
                [map_id]
            )
            row = cursor.fetchone()
            if not row:
                return False
            requirement_id = row[0]
            return self.can_modify_requirement(user_id, role_id, requirement_id)

    def can_update_pipeline(self, user_id, role_id, map_id):
        """Same ownership chain + state-transition validation."""
        return self.can_schedule_interview(user_id, role_id, map_id)

    def can_reassign_requirement(self, user_id, role_id):
        """Only Admin (role 1) can reassign jobs between HR users."""
        return role_id == 1

    def get_allowed_requirements(self, user_id, role_id):
        """
        Returns list of requirement_ids the user can access.
        Admin: all | Manager: created_by | HR: assigned_to + unassigned
        """
        with connection.cursor() as cursor:
            if role_id == 1:  # Admin
                cursor.execute("SELECT requirement_id FROM job_requirement")
                return [row[0] for row in cursor.fetchall()]
            elif role_id == 2:  # Manager
                cursor.execute("SELECT requirement_id FROM job_requirement WHERE created_by = %s", [user_id])
                return [row[0] for row in cursor.fetchall()]
            elif role_id == 3:  # HR
                cursor.execute(
                    "SELECT requirement_id FROM job_requirement WHERE assigned_to = %s OR assigned_to IS NULL",
                    [user_id]
                )
                return [row[0] for row in cursor.fetchall()]
        return []

    def validate_transition(self, current_status, new_status, role_id=None):
        """
        Enforces valid pipeline state transitions.
        Returns (is_valid: bool, error_message: str | None)

        Valid transitions:
            applied     → evaluated
            evaluated   → shortlisted
            shortlisted → approved
            approved    → interview_scheduled
            interview_scheduled → exam_pending
            exam_pending → exam_scored
            exam_scored → finalised
            finalised   → joined | rejected

        All states → rejected (early exit allowed)
        """
        # Normalizing to lower case
        current = current_status.lower() if current_status else 'applied'
        new = new_status.lower() if new_status else 'applied'

        if current == 'new':
            current = 'applied'
        if new == 'new':
            new = 'applied'

        if current == new:
            return True, None

        if current in ('joined', 'rejected'):
            if role_id == 1:
                return True, None
            else:
                return False, "Finalized records cannot be modified except by Admins."

        if new == 'rejected':
            return True, None

        valid_transitions = {
            'applied': ['evaluated'],
            'evaluated': ['shortlisted'],
            'shortlisted': ['approved'],
            'approved': ['interview_scheduled'],
            'interview_scheduled': ['exam_pending'],
            'exam_pending': ['exam_scored'],
            'exam_scored': ['finalised'],
            'finalised': ['joined', 'rejected'],
            'joined': [],
            'rejected': []
        }

        allowed_next = valid_transitions.get(current, [])
        if new in allowed_next:
            return True, None
            
        return False, f"Invalid transition: cannot move candidate from '{current_status}' to '{new_status}'."

