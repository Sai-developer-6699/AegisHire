"""
recruitment/middleware.py

Injects a unique request_id (UUID4) into every request and logs
structured request/response metadata: method, path, status, latency_ms.
"""
import uuid
import time
import logging

logger = logging.getLogger('recruitment')


class RequestLoggingMiddleware:
    """
    Attaches request_id to each request for end-to-end traceability.
    Logs: request_id, user_id, method, path, status, latency_ms.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid.uuid4())[:8]   # Short ID for readability
        request.request_id = request_id

        start_time = time.monotonic()
        response = self.get_response(request)
        latency_ms = round((time.monotonic() - start_time) * 1000, 1)

        user_id = request.session.get('userid', '-')

        # Skip logging for static/media file requests
        path = request.path
        if not path.startswith(('/static/', '/media/')):
            logger.info(
                f"req={request_id} user={user_id} "
                f"{request.method} {path} -> {response.status_code} "
                f"[{latency_ms}ms]"
            )

        # Attach request_id to response header for debugging
        response['X-Request-ID'] = request_id
        return response
