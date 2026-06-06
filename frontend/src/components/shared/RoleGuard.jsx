import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';

// Role home mappings for redirecting unauthorized roles to their respective dashboards
const ROLE_HOME_MAP = {
  1: '/admin',
  2: '/manager',
  3: '/hr',
  4: '/candidate',
};

/**
 * Route protector that guards screens based on session state and role permissions.
 * Uses the React Router v6 Outlet pattern for nesting.
 */
export function RoleGuard({ requiredPermission }) {
  const { userid, roleid, status } = useAuth();
  const { hasPermission } = usePermissions();

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a1727] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent"></div>
          <p className="text-sm font-medium tracking-wide">Validating session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !userid) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    const fallbackPath = ROLE_HOME_MAP[roleid] ?? '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

