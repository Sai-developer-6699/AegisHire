from .audit_service import audit_service
import json

class AuthzAuditLogger:
    """
    Logs all authorization and authentication failures to the audit_log table.
    """

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def _get_sanitized_payload(self, request):
        try:
            if request.method in ('POST', 'PUT', 'PATCH'):
                if hasattr(request, 'data'):
                    data = request.data
                else:
                    data = json.loads(request.body.decode('utf-8'))
                
                if isinstance(data, dict):
                    sanitized = data.copy()
                    for key in ['password', 'pwd', 'secret', 'token']:
                        if key in sanitized:
                            sanitized[key] = '******'
                    return sanitized
                return str(data)
        except Exception:
            pass
        return None

    def log_401(self, request, reason):
        ip = self._get_client_ip(request)
        details = {
            'reason': reason,
            'ip_address': ip,
            'endpoint': request.path,
            'method': request.method
        }
        audit_service.log(
            action='auth_failure_401',
            actor_id=0,
            target_type='request',
            details=details
        )

    def log_403(self, request, reason, target_id=None):
        userid = request.session.get('userid', 0)
        ip = self._get_client_ip(request)
        payload = self._get_sanitized_payload(request)
        details = {
            'reason': reason,
            'ip_address': ip,
            'endpoint': request.path,
            'method': request.method,
            'payload': payload
        }
        audit_service.log(
            action='auth_failure_403',
            actor_id=userid,
            target_type='request',
            target_id=target_id,
            details=details
        )

    def log_transition_denied(self, request, map_id, from_status, to_status):
        userid = request.session.get('userid', 0)
        ip = self._get_client_ip(request)
        details = {
            'reason': 'invalid_transition',
            'from_status': from_status,
            'to_status': to_status,
            'ip_address': ip,
            'endpoint': request.path,
            'method': request.method
        }
        audit_service.log(
            action='transition_denied',
            actor_id=userid,
            target_type='resume_job_map',
            target_id=map_id,
            details=details
        )
