import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';

// Helper component for fallback rendering inside Suspense
function LoadingOverlay() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a1727] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium tracking-wide">Loading module...</p>
      </div>
    </div>
  );
}

// Eager-loaded critical path
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const LandingPage = lazy(() => import('@/pages/marketing/LandingPage'));

// Lazy-loaded route modules — each role's chunks are split dynamically
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AllUsersPage   = lazy(() => import('@/pages/admin/AllUsersPage'));
const AddUserPage    = lazy(() => import('@/pages/admin/AddUserPage'));
const UserGroupsPage = lazy(() => import('@/pages/admin/UserGroupsPage'));
const DesignSystemPage = lazy(() => import('@/pages/admin/DesignSystemPage'));
const LandingSandboxPage = lazy(() => import('@/pages/admin/LandingSandboxPage'));

const ManagerDashboard         = lazy(() => import('@/pages/manager/ManagerDashboard'));
const JobCreationPage          = lazy(() => import('@/pages/manager/JobCreationPage'));
const ShortlistPage            = lazy(() => import('@/pages/manager/ShortlistPage'));
const CandidatePerformancePage = lazy(() => import('@/pages/manager/CandidatePerformancePage'));

const HRDashboard             = lazy(() => import('@/pages/hr/HRDashboard'));
const ResumeUploadPage        = lazy(() => import('@/pages/hr/ResumeUploadPage'));
const FilterResumePage        = lazy(() => import('@/pages/hr/FilterResumePage'));
const InterviewSchedulingPage = lazy(() => import('@/pages/hr/InterviewSchedulingPage'));
const FinalisedCandidatesPage = lazy(() => import('@/pages/hr/FinalisedCandidatesPage'));
const GenerateQuestionsPage   = lazy(() => import('@/pages/hr/GenerateQuestionsPage'));
const PipelineBoard           = lazy(() => import('@/pages/hr/PipelineBoard'));


const CandidateDashboard = lazy(() => import('@/pages/candidate/CandidateDashboard'));

export default function App() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin protected routes */}
        <Route element={<RoleGuard requiredPermission="canEditUsers" />}>
          <Route element={<AppShell />}>
            <Route path="/admin"                element={<AdminDashboard />} />
            <Route path="/admin/users"          element={<AllUsersPage />} />
            <Route path="/admin/users/add"      element={<AddUserPage />} />
            <Route path="/admin/user-groups"    element={<UserGroupsPage />} />
            <Route path="/admin/design-system"  element={<DesignSystemPage />} />
            <Route path="/admin/landing-sandbox" element={<LandingSandboxPage />} />
          </Route>
        </Route>

        {/* Manager protected routes */}
        <Route element={<RoleGuard requiredPermission="canViewManagerDashboard" />}>
          <Route element={<AppShell />}>
            <Route path="/manager"                    element={<ManagerDashboard />} />
            <Route path="/manager/jobs"               element={<JobCreationPage />} />
            <Route path="/manager/shortlist"          element={<ShortlistPage />} />
            <Route path="/manager/performance"        element={<CandidatePerformancePage />} />
          </Route>
        </Route>

        {/* HR protected routes */}
        <Route element={<RoleGuard requiredPermission="canViewHRDashboard" />}>
          <Route element={<AppShell />}>
            <Route path="/hr"                         element={<HRDashboard />} />
            <Route path="/hr/upload"                  element={<ResumeUploadPage />} />
            <Route path="/hr/evaluate"                element={<FilterResumePage />} />
            <Route path="/hr/interviews"              element={<InterviewSchedulingPage />} />
            <Route path="/hr/finalised"               element={<FinalisedCandidatesPage />} />
            <Route path="/hr/generate"                element={<GenerateQuestionsPage />} />
            <Route path="/hr/pipeline"                element={<PipelineBoard />} />
          </Route>
        </Route>


        {/* Candidate protected routes */}
        <Route element={<RoleGuard requiredPermission="canTakeExams" />}>
          <Route path="/candidate"                  element={<CandidateDashboard />} />
        </Route>


        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
