/**
 * Normalizes manager-specific data structures.
 */

export function adaptManagerPosition(raw) {
  if (!raw) return null;
  return {
    requirementId:     raw.requirement_id ?? null,
    positionName:      raw.position_name ?? 'Unknown Position',
    shortlistedCount:  raw.shortlisted_count ?? 0,
  };
}

export function adaptManagerPositionList(rawList) {
  return (rawList ?? []).map(adaptManagerPosition);
}

export function adaptShortlistedCandidate(raw) {
  if (!raw) return null;
  return {
    resumeId:     raw.resume_id ?? null,
    name:         raw.name ?? 'Unknown',
    email:        raw.email ?? null,
    resumeUrl:    raw.resume_url ?? null,
    aiScore:      raw.ai_score != null ? parseFloat(raw.ai_score) : null,
    positionName: raw.position_name ?? 'Unknown Position',
  };
}

export function adaptShortlistedCandidateList(rawList) {
  return (rawList ?? []).map(adaptShortlistedCandidate);
}

export function adaptCandidatePerformance(raw) {
  if (!raw) return null;
  return {
    mapId:      raw.map_id ?? null,
    resumeId:   raw.resume_id ?? null,
    name:       raw.name ?? raw.resume_name ?? 'Unknown',
    email:      raw.email ?? null,
    status:     raw.status ?? 'unknown',
    examScore:  raw.exam_score != null ? parseFloat(raw.exam_score) : null,
  };
}

export function adaptCandidatePerformanceList(rawList) {
  return (rawList ?? []).map(adaptCandidatePerformance);
}

export function adaptExamAnswerDetail(raw) {
  if (!raw) return null;
  return {
    answerId:     raw.answer_id ?? null,
    questionId:   raw.question_id ?? null,
    questionText: raw.question_text ?? '',
    questionType: raw.question_type ?? 'text',
    options:      raw.options ?? null, // could be JSON string/array
    answerText:   raw.answer_text ?? '',
    scoreAwarded: raw.score_awarded != null ? parseFloat(raw.score_awarded) : null,
    isCorrect:    raw.is_correct ?? null,
  };
}

export function adaptExamAnswerDetailList(rawList) {
  return (rawList ?? []).map(adaptExamAnswerDetail);
}
