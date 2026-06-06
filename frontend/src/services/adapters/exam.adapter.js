/**
 * Normalizes exam/candidate assessment data from the backend.
 */

export function adaptExamSession(raw) {
  if (!raw) return null;
  return {
    sessionId:   raw.session_id ?? null,
    status:      raw.status ?? 'not_started',
    startedAt:   raw.started_at ?? null,
    completedAt: raw.completed_at ?? null,
    message:     raw.message ?? null,
  };
}
