import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  PlusCircle,
  CheckSquare,
  BarChart3,
  UploadCloud,
  FileSpreadsheet,
  Calendar,
  Award,
  Cpu,
  LogOut,
  Shield,
  Kanban
} from 'lucide-react';

const NAV_ITEMS = {
  // Admin Navigation (roleid = 1)
  1: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'All Users', path: '/admin/users', icon: Users },
    { label: 'Add User', path: '/admin/users/add', icon: UserPlus },
    { label: 'User Groups', path: '/admin/user-groups', icon: Briefcase },
  ],
  // Manager Navigation (roleid = 2)
  2: [
    { label: 'Dashboard', path: '/manager', icon: LayoutDashboard },
    { label: 'Create Job', path: '/manager/jobs', icon: PlusCircle },
    { label: 'Shortlist Approval', path: '/manager/shortlist', icon: CheckSquare },
  ],
  // HR Navigation (roleid = 3)
  3: [
    { label: 'Dashboard', path: '/hr', icon: LayoutDashboard },
    { label: 'Pipeline Board', path: '/hr/pipeline', icon: Kanban },
    { label: 'Upload Resumes', path: '/hr/upload', icon: UploadCloud },
    { label: 'Evaluate Resumes', path: '/hr/evaluate', icon: FileSpreadsheet },
    { label: 'Interview Scheduling', path: '/hr/interviews', icon: Calendar },
    { label: 'Finalised Candidates', path: '/hr/finalised', icon: Award },
    { label: 'Generate Questions', path: '/hr/generate', icon: Cpu },
  ],

  // Candidate Navigation (roleid = 4)
  4: [
    { label: 'Dashboard', path: '/candidate', icon: LayoutDashboard },
  ],
};

const ROLE_NAME_MAP = {
  1: 'Administrator',
  2: 'Hiring Manager',
  3: 'HR Manager',
  4: 'Candidate',
};

export function Sidebar() {
  const { roleid, username, logout } = useAuth();
  const location = useLocation();

  const items = NAV_ITEMS[roleid] ?? [];
  const roleName = ROLE_NAME_MAP[roleid] ?? 'User';

  const userInitials = username
    ? username.split('_').pop()?.substring(0, 2).toUpperCase() || 'U'
    : 'U';

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col border-r border-sidebar-border h-screen select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wider text-white">AEGISHIRE</h1>
          <p className="text-[10px] text-primary tracking-widest uppercase font-semibold">Recruitment AI</p>
        </div>
      </div>

      {/* Nav Link List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          // Determine if path is active (exact match for dashboards, startsWith for subpages unless there's a more specific sibling path active)
          const isDashboard = item.path === '/admin' || item.path === '/manager' || item.path === '/hr' || item.path === '/candidate';
          const isActive = isDashboard 
            ? location.pathname === item.path 
            : location.pathname === item.path || (
                location.pathname.startsWith(item.path + '/') && 
                !items.some(other => 
                  other.path !== item.path && 
                  other.path.startsWith(item.path) && 
                  location.pathname.startsWith(other.path)
                )
              );

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-gray-400 hover:bg-sidebar-accent hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile & Footer */}
      <div className="p-6 border-t border-sidebar-border flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-primary font-bold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">{username}</p>
            <p className="text-xs text-primary font-semibold">{roleName}</p>
          </div>
        </div>

        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10 gap-3 border border-sidebar-border hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
export default Sidebar;
