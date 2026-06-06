/**
 * Normalizes interview-related data from the backend.
 */

export function adaptInterview(raw) {
  if (!raw) return null;
  return {
    scheduleId:        raw.schedule_id ?? null,
    mapId:             raw.map_id ?? null,
    candidateName:     raw.candidate_name ?? 'Unknown Candidate',
    interviewDatetime: raw.interview_datetime ?? null,
    interviewer:       raw.interviewer ?? 'Not Assigned',
    createdAt:         raw.created_at ?? null,
  };
}

export function adaptInterviewList(rawList) {
  return (rawList ?? []).map(adaptInterview);
}

export function adaptInterviewCandidate(raw) {
  if (!raw) return null;
  return {
    mapId:     raw.map_id ?? null,
    resumeId:  raw.resume_id ?? null,
    name:      raw.name ?? raw.resume_name ?? 'Unknown',
    email:     raw.email ?? null,
    phone:     raw.phone ?? raw.phone_number ?? null,
    status:    raw.status ?? 'unknown',
    examScore: raw.exam_score != null ? parseFloat(raw.exam_score) : null,
  };
}

export function adaptInterviewCandidateList(rawList) {
  return (rawList ?? []).map(adaptInterviewCandidate);
}

