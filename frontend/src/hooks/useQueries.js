import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumesService } from '@/services/resumes.service';
import { jobsService } from '@/services/jobs.service';
import { interviewService } from '@/services/interview.service';

/**
 * Audit logs store utilizing local storage to maintain activity logs across actions.
 */
const AUDIT_LOG_KEY = 'aegishire_audit_logs';

function getLocalAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 1, date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), user: 'admin', action: 'System initialized and database synchronized.' },
      { id: 2, date: new Date(Date.now() - 1000 * 60 * 15).toISOString(), user: 'hr_manager', action: 'Uploaded initial baseline job requirements.' }
    ];
  } catch {
    return [];
  }
}

export function addLocalAuditLog(user, action) {
  try {
    const logs = getLocalAuditLogs();
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      user: user || 'system',
      action
    };
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([newLog, ...logs].slice(0, 100)));
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

// ----------------------------------------------------
// Resumes & Candidates Queries
// ----------------------------------------------------

export function useResumesRecent(limit = 6) {
  return useQuery({
    queryKey: ['resumes', 'recent', limit],
    queryFn: () => resumesService.getRecent(limit),
  });
}

export function useResumesEvaluated(requirementId) {
  return useQuery({
    queryKey: ['resumes', 'evaluated', requirementId],
    queryFn: () => resumesService.getEvaluated(requirementId),
    enabled: !!requirementId,
  });
}

export function useInterviewCandidates() {
  return useQuery({
    queryKey: ['interviews', 'candidates'],
    queryFn: () => interviewService.getCandidatesForInterview(),
  });
}

export function useScheduledInterviews() {
  return useQuery({
    queryKey: ['interviews', 'scheduled'],
    queryFn: () => interviewService.getScheduledInterviews(),
  });
}

// ----------------------------------------------------
// Jobs Queries
// ----------------------------------------------------

export function useJobsRecent() {
  return useQuery({
    queryKey: ['jobs', 'recent'],
    queryFn: () => jobsService.getRecentJobs(),
  });
}

export function useJobsAll() {
  return useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => jobsService.getAll(),
  });
}

export function useJobDetail(requirementId) {
  return useQuery({
    queryKey: ['jobs', 'detail', requirementId],
    queryFn: () => jobsService.getDetail(requirementId),
    enabled: !!requirementId,
  });
}

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: () => jobsService.getPositions(),
  });
}

export function useRecommendations(positionName) {
  return useQuery({
    queryKey: ['recommendations', positionName],
    queryFn: () => jobsService.getRecommendations(positionName),
    enabled: !!positionName,
  });
}

// ----------------------------------------------------
// Audit Logs Query
// ----------------------------------------------------

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => getLocalAuditLogs(),
  });
}

// ----------------------------------------------------
// Mutations (with Auto-Cache Invalidation)
// ----------------------------------------------------

export function useUploadResumeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => resumesService.upload(formData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      // Add audit log
      const candidateName = variables.get?.('name') || 'applicant';
      addLocalAuditLog('hr_manager', `Uploaded resume document for candidate "${candidateName}".`);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useEvaluateResumesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, limit }) => resumesService.evaluate(requirementId, limit),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      addLocalAuditLog('hr_manager', `Triggered AI matching score evaluation for requirement ID: ${variables.requirementId}.`);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useShortlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shortlistData) => resumesService.shortlist(shortlistData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', 'candidates'] });
      addLocalAuditLog('hr_manager', `Approved and submitted candidates list to the Hiring Manager shortlist.`);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useSubmitJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobData) => jobsService.submitJob(jobData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      addLocalAuditLog('hiring_manager', `Created new job requirement posting for: "${variables.position}".`);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useScheduleInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mapId, datetime, interviewer }) =>
      interviewService.scheduleInterview(mapId, datetime, interviewer),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      addLocalAuditLog('hr_manager', `Scheduled candidate interview assessment slot for ${variables.datetime} with interviewer: "${variables.interviewer || 'N/A'}".`);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}
