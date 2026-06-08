/**
 * Normalizes resume and resume mapping data from the backend.
 */

export function adaptResume(raw) {
  if (!raw) return null;

  return {
    id:            raw.resume_id   ?? raw.id ?? null,
    name:          raw.name        ?? raw.resume_name ?? 'Unknown Candidate',
    email:         raw.email       ?? null,
    phone:         raw.phone_number ?? raw.phone ?? null,
    score:         raw.score       != null ? parseFloat(raw.score) : null,
    status:        raw.status      ?? 'unknown',
    resumeUrl:     raw.resumeUrl   ?? raw.resume_url ?? raw.file_url ?? raw.file_location ?? null,
    uploadedAt:    raw.uploaded_at ?? null,
    mapId:         raw.map_id      ?? null,
    examScore:     raw.exam_score  != null ? parseFloat(raw.exam_score) : null,
    requirementId: raw.requirement_id ?? raw.requirementId ?? null,
  };
}

export function adaptResumeList(rawList) {
  return (rawList ?? []).map(adaptResume);
}
