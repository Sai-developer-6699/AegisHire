from .services.ownership_service import OwnershipService

class RequestScope:
    def __init__(self, user_id=None, role_id=None, requirements=None, is_authenticated=False):
        self.user_id = user_id
        self.role_id = role_id
        self.requirements = requirements or []
        self.is_authenticated = is_authenticated

class DataScopeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.ownership = OwnershipService()

    def __call__(self, request):
        user_id = request.session.get('userid')
        role_id = request.session.get('roleid')
        
        if user_id:
            allowed_reqs = self.ownership.get_allowed_requirements(user_id, role_id)
            request.scope = RequestScope(
                user_id=int(user_id),
                role_id=int(role_id) if role_id is not None else None,
                requirements=allowed_reqs,
                is_authenticated=True
            )
        else:
            request.scope = RequestScope()

        return self.get_response(request)
