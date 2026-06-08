/**
 * Normalizes job requirements and job details from the backend.
 */

export function adaptJob(raw) {
  if (!raw) return null;

  // Sometimes core requirement info comes wrapped in a 'requirement' key
  const core = raw.requirement ?? raw;

  return {
    requirementId:    core.requirement_id ?? null,
    position:         core.position ?? 'Unknown Position',
    experience:       core.experience ?? core.experience_range ?? 'Not specified',
    createdBy:        core.created_by ?? null,
    createdAt:        core.created_at ?? null,
    assignedTo:       core.assigned_to ?? null,
    assignedUsername: core.assigned_username ?? null,
    status:           core.status ?? 'ACTIVE',
    closedAt:         core.closed_at ?? null,
    closedBy:         core.closed_by ?? null,
    skills:           raw.skills ?? [],
    softSkills:       raw.soft_skills ?? [],
    education:        raw.education ?? [],
  };
}

export function adaptJobList(rawList) {
  return (rawList ?? []).map(rawItem => adaptJob(rawItem));
}
