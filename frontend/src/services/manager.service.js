import { apiFetch } from './api';
import {
  adaptManagerPositionList,
  adaptShortlistedCandidateList,
  adaptCandidatePerformanceList,
  adaptExamAnswerDetailList
} from './adapters/manager.adapter';

export const managerService = {
  /**
   * Fetches list of positions with count of shortlisted candidates.
   * @returns {Promise<Array>}
   */
  async getPositionsWithShortlisted() {
    const data = await apiFetch('api/manager/positions-in-shortlisted/');
    return adaptManagerPositionList(data);
  },

  /**
   * Fetches detailed list of shortlisted candidates for a job requirement.
   * @param {number} requirementId
   * @returns {Promise<Array>}
   */
  async getShortlistedCandidates(requirementId) {
    const data = await apiFetch(`api/manager/shortlist-details/${requirementId}/`);
    return adaptShortlistedCandidateList(data);
  },

  /**
   * Submits shortlist approval decisions.
   * @param {Array<number|string>} candidateIds - IDs of approved candidates
   * @param {number|string} requirementId
   */
  async approveShortlist(candidateIds, requirementId) {
    return apiFetch('api/manager/approve-shortlist/', {
      method: 'POST',
      body: JSON.stringify({
        candidate_ids: candidateIds.map(String),
        requirement_id: String(requirementId)
      })
    });
  },

  /**
   * Fetches performance list of candidates for a job requirement.
   * @param {number} requirementId
   * @returns {Promise<Array>}
   */
  async getCandidatesPerformance(requirementId) {
    const data = await apiFetch(`api/manager/performance/${requirementId}/`);
    return adaptCandidatePerformanceList(data?.candidates);
  },

  /**
   * Fetches candidate exam answers.
   * @param {number} mapId
   * @returns {Promise<Object>} { sessionId, answers: [...] }
   */
  async getExamAnswers(mapId) {
    const data = await apiFetch(`api/manager/exam-answers/${mapId}/`);
    return {
      sessionId: data?.session_id ?? null,
      answers: adaptExamAnswerDetailList(data?.answers)
    };
  },

  /**
   * Updates scores and correctness for exam answers.
   * @param {number} sessionId
   * @param {Array<Object>} answers - [{ answer_id, score_awarded, is_correct }]
   */
  async updateExamScores(sessionId, answers) {
    return apiFetch('api/manager/update-exam-scores/', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        answers: answers.map(ans => ({
          answer_id: ans.answerId ?? ans.answer_id,
          score_awarded: ans.scoreAwarded ?? ans.score_awarded,
          is_correct: ans.isCorrect ?? ans.is_correct
        }))
      })
    });
  }
};

export default managerService;
