/**
 * Normalizes HR-specific operations and mappings from the backend.
 */

export function adaptFinalisedCandidate(raw) {
  if (!raw) return null;
  return {
    mapId:       raw.map_id ?? null,
    resumeId:    raw.resume_id ?? null,
    name:        raw.name ?? raw.resume_name ?? 'Unknown',
    email:       raw.email ?? null,
    status:      raw.status ?? 'finalised',
    finalisedAt: raw.finalised_at ?? null,
  };
}

export function adaptFinalisedCandidateList(rawList) {
  return (rawList ?? []).map(adaptFinalisedCandidate);
}
