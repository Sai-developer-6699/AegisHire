import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';


const ROUTE_TITLE_MAP = {
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/users/add': 'Register New User',
  '/admin/user-groups': 'Access Groups',
  '/manager': 'Hiring Overview',
  '/manager/jobs': 'Create Job Postings',
  '/manager/shortlist': 'Shortlist Reviews',
  '/hr': 'HR Recruitment Operations',
  '/hr/upload': 'Upload Resumes',
  '/hr/evaluate': 'AI Evaluation',
  '/hr/interviews': 'Interview Scheduling',
  '/hr/finalised': 'Onboarding Candidates',
  '/hr/generate': 'Generate Exam Questions',
  '/candidate': 'Assessment Console',
};

export function TopBar({ onToggleCopilot }) {
  const { username } = useAuth();
  const location = useLocation();

  // Find matching title or extract route base path
  const title = ROUTE_TITLE_MAP[location.pathname] ?? 
                Object.entries(ROUTE_TITLE_MAP).find(([path]) => location.pathname.startsWith(path))?.[1] ?? 
                'AegisHire System';

  return (
    <header className="h-16 bg-sidebar border-b border-border flex items-center justify-between px-8 text-white select-none">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide text-md">{title}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-secondary px-3 py-1.5 rounded-full border border-border">
          <ShieldCheck className="h-4 w-4 text-[#3B82F6] animate-pulse" />
          <span>Secure Connection</span>
        </div>

        {/* User greeting */}
        <div className="text-right text-xs">
          <p className="text-gray-400">Logged in as</p>
          <p className="font-medium text-white">{username || 'Guest'}</p>
        </div>

        {/* AI Copilot launcher */}
        {onToggleCopilot && (
          <Button
            onClick={onToggleCopilot}
            className="bg-[#3B82F6]/10 hover:bg-[#3B82F6]/25 text-[#3B82F6] border border-[#3B82F6]/20 text-xs font-bold gap-1.5 h-8 rounded px-3"
          >
            <Sparkles className="h-4 w-4 text-[#3B82F6] animate-pulse" />
            <span>AI Copilot</span>
          </Button>
        )}
      </div>
    </header>
  );
}
export default TopBar;
