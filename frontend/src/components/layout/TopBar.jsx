import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sparkles, Bell, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { noticesService } from '@/services/notices.service';
import { toast } from 'sonner';

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
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotices = async () => {
    try {
      const data = await noticesService.getNotices();
      setNotices(data || []);
    } catch (err) {
      console.error("Failed to load notices:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotices, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (noticeId) => {
    try {
      await noticesService.markAsRead(noticeId);
      setNotices((prev) => prev.filter((n) => n.notice_id !== noticeId));
      toast.success("Notice dismissed");
    } catch (err) {
      toast.error("Failed to update notice status");
    }
  };

  const handleAction = async (notice) => {
    try {
      await noticesService.markAsRead(notice.notice_id);
      setNotices((prev) => prev.filter((n) => n.notice_id !== notice.notice_id));
      setIsOpen(false);
      navigate(notice.action_url);
    } catch (err) {
      toast.error("Failed to handle notice action");
    }
  };

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

        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-secondary rounded-lg transition-colors flex items-center"
          >
            <Bell className="h-5 w-5" />
            {notices.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200">
              <div className="p-4 border-b border-border bg-[#0d1726]/80 flex justify-between items-center">
                <h4 className="font-bold text-sm">Notifications</h4>
                {notices.length > 0 && (
                  <span className="text-[10px] bg-[#3B82F6]/20 text-[#3B82F6] font-semibold px-2 py-0.5 rounded-full">
                    {notices.length} New
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                {notices.map((notice) => (
                  <div key={notice.notice_id} className="p-4 hover:bg-secondary/10 transition-colors space-y-2 text-left">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-[#3B82F6] tracking-wider">
                        {(notice.notice_type || '').replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => handleMarkRead(notice.notice_id)}
                        className="text-gray-500 hover:text-white"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">{notice.title}</p>
                    <p className="text-[11px] text-gray-400 leading-normal">{notice.message}</p>
                    {notice.action_url && (
                      <Button
                        size="sm"
                        onClick={() => handleAction(notice)}
                        className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-[#0a1727] font-bold text-[10px] h-7 gap-1 mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Create Account</span>
                      </Button>
                    )}
                  </div>
                ))}
                {notices.length === 0 && (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}
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
