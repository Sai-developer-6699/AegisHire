import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  UserCheck,
  CheckCircle2,
  Calendar,
  ClipboardList,
  Award,
  UserPlus,
  XCircle,
  HelpCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  evaluated: {
    label: 'Evaluated',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/10',
    icon: FileText,
  },
  shortlisted: {
    label: 'Shortlisted',
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10',
    icon: UserCheck,
  },
  approved: {
    label: 'Approved',
    className: 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/10',
    icon: CheckCircle2,
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/10',
    icon: Calendar,
  },
  exam_scored: {
    label: 'Exam Scored',
    className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10',
    icon: ClipboardList,
  },
  finalised: {
    label: 'Finalised',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/10',
    icon: Award,
  },
  joined: {
    label: 'Joined',
    className: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/10',
    icon: UserPlus,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/10',
    icon: XCircle,
  },
};

/**
 * StatusBadge maps a candidate status string to a styled component with matching color and icon.
 */
export function StatusBadge({ status }) {
  const normalized = status?.toLowerCase() || 'unknown';
  const config = STATUS_CONFIG[normalized] || {
    label: status || 'Unknown',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/10',
    icon: HelpCircle,
  };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 w-fit px-2.5 py-1 ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
export default StatusBadge;
