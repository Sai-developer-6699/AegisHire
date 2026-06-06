"""
recruitment/decorators.py

Enforces authentication and role-based access control with audit logging.
"""
import logging
from functools import wraps
from rest_framework.response import Response
from .services.audit_logger import AuthzAuditLogger

logger = logging.getLogger('recruitment')
audit_logger = AuthzAuditLogger()


def require_auth(func):
    """
    Decorator that enforces authentication.
    """
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not getattr(request, 'scope', None) or not request.scope.is_authenticated:
            logger.warning(f"Unauthenticated access attempt to {func.__name__}")
            audit_logger.log_401(request, f"Unauthenticated access attempt to {func.__name__}")
            return Response({'error': 'Authentication required.'}, status=401)
        return func(request, *args, **kwargs)
    return wrapper


def require_role(allowed_roles: list[int]):
    """
    Decorator that enforces role-based access control.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not getattr(request, 'scope', None) or not request.scope.is_authenticated:
                logger.warning(f"Unauthenticated access attempt to {func.__name__}")
                audit_logger.log_401(request, f"Unauthenticated access attempt to {func.__name__}")
                return Response({'error': 'Authentication required.'}, status=401)

            roleid = request.scope.role_id
            userid = request.scope.user_id

            if roleid not in allowed_roles:
                logger.warning(
                    f"User {userid} (role={roleid}) attempted to access "
                    f"{func.__name__} (allowed roles: {allowed_roles})"
                )
                audit_logger.log_403(request, f"Role {roleid} not allowed for {func.__name__}")
                return Response(
                    {'error': f'Access denied. Required role: {allowed_roles}'},
                    status=403
                )

            return func(request, *args, **kwargs)
        return wrapper
    return decorator

