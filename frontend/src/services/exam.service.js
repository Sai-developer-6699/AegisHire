import { apiFetch } from './api';
import { adaptExamSession } from './adapters/exam.adapter';

export const examService = {
  /**
   * Starts an exam session for the candidate.
   * @param {number} resumeId
   * @param {number} requirementId
   * @returns {Promise<Object>} Adapted exam session state
   */
  async startExamSession(resumeId, requirementId) {
    const data = await apiFetch('api/candidate/start-exam/', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        requirement_id: requirementId
      })
    });
    return adaptExamSession(data);
  },

  /**
   * Submits exam answers for the session.
   * @param {number} sessionId
   * @param {Array<Object>} answers - [{ question_id, answer_text }]
   */
  async submitExamAnswers(sessionId, answers) {
    return apiFetch('api/candidate/submit-answers/', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        answers: answers.map(ans => ({
          question_id: ans.questionId ?? ans.question_id,
          answer_text: ans.answerText ?? ans.answer_text
        }))
      })
    });
  },

  /**
   * Fetches the exam session status.
   * @param {number} sessionId
   * @returns {Promise<Object>} Adapted exam session state
   */
  async getExamStatus(sessionId) {
    const data = await apiFetch(`api/candidate/exam-status/${sessionId}/`);
    return adaptExamSession({
      session_id: sessionId,
      ...data
    });
  },

  /**
   * Fetches active exam questions for the candidate session.
   */
  async getExamQuestions(sessionId) {
    const data = await apiFetch(`api/candidate/exam-questions/${sessionId}/`);
    return data?.questions || [];
  }
};

export default examService;
