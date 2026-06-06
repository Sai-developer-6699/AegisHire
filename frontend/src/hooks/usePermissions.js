import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS } from '@/lib/permissions';

/**
 * Custom React Hook to check user capability flags.
 * Used for role-agnostic conditional UI rendering.
 */
export function usePermissions() {
  const { roleid } = useAuth();
  const permissions = ROLE_PERMISSIONS[roleid] ?? [];

  return {
    permissions,
    hasPermission: (perm) => permissions.includes(perm),
    // Admin Actions
    canEditUsers: permissions.includes('canEditUsers'),
    canAddUsers: permissions.includes('canAddUsers'),
    canManageSystem: permissions.includes('canManageSystem'),
    canViewAllDashboards: permissions.includes('canViewAllDashboards'),
    // Manager Actions
    canCreateJobs: permissions.includes('canCreateJobs'),
    canApproveShortlist: permissions.includes('canApproveShortlist'),
    canGradeExams: permissions.includes('canGradeExams'),
    canViewManagerDashboard: permissions.includes('canViewManagerDashboard'),
    // HR Actions
    canUploadResumes: permissions.includes('canUploadResumes'),
    canEvaluateResumes: permissions.includes('canEvaluateResumes'),
    canScheduleInterviews: permissions.includes('canScheduleInterviews'),
    canFinaliseCandidates: permissions.includes('canFinaliseCandidates'),
    canGenerateQuestions: permissions.includes('canGenerateQuestions'),
    canViewHRDashboard: permissions.includes('canViewHRDashboard'),
    // Candidate Actions
    canTakeExams: permissions.includes('canTakeExams'),
    canViewCandidateDashboard: permissions.includes('canViewCandidateDashboard')
  };
}

export default usePermissions;
