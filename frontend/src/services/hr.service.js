import { apiFetch } from './api';
import { adaptFinalisedCandidateList } from './adapters/hr.adapter';

export const hrService = {
  /**
   * Fetches the list of all finalised candidates.
   * @returns {Promise<Array>}
   */
  async getFinalisedCandidates() {
    const data = await apiFetch('api/hr/finalised-candidates/');
    return adaptFinalisedCandidateList(data?.candidates);
  },

  /**
   * Updates status for finalised candidates in bulk.
   * @param {Array<Object>} updates - [{ mapId, newStatus }] (newStatus: 'joined' | 'rejected')
   */
  async updateFinalisedStatus(updates) {
    return apiFetch('api/hr/update-finalised-status/', {
      method: 'POST',
      body: JSON.stringify({
        updates: updates.map(upd => ({
          map_id: upd.mapId ?? upd.map_id,
          new_status: upd.newStatus ?? upd.new_status
        }))
      })
    });
  },

  /**
   * Generates AI-powered questions for a job requirement.
   */
  async generateExamQuestions(requirementId, technical, problemSolving, behavioral, difficulty) {
    return apiFetch('api/hr/generate-exam-questions/', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: Number(requirementId),
        num_technical: Number(technical),
        num_problem_solving: Number(problemSolving),
        num_behavioral: Number(behavioral),
        difficulty: difficulty
      })
    });
  },

  /**
   * Fetches questions from the question bank.
   */
  async getQuestionBank(requirementId, status = '') {
    const url = `api/hr/question-bank/?requirement_id=${requirementId}&status=${status}`;
    return apiFetch(url);
  },

  /**
   * Manually creates a question in the question bank.
   */
  async createQuestion(questionData) {
    return apiFetch('api/hr/question-bank/create/', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: Number(questionData.requirementId),
        text: questionData.text,
        type: questionData.type,
        options: questionData.options,
        correct_answer: questionData.correctAnswer,
        skill: questionData.skill,
        difficulty: questionData.difficulty,
        category: questionData.category
      })
    });
  },

  /**
   * Updates an existing question. Clones if already approved/published.
   */
  async updateQuestion(questionId, questionData) {
    return apiFetch(`api/hr/question-bank/${questionId}/`, {
      method: 'PUT',
      body: JSON.stringify({
        text: questionData.text,
        type: questionData.type,
        options: questionData.options,
        correct_answer: questionData.correctAnswer,
        skill: questionData.skill,
        difficulty: questionData.difficulty,
        category: questionData.category
      })
    });
  },

  /**
   * Approves a question in the bank.
   */
  async approveQuestion(questionId) {
    return apiFetch(`api/hr/question-bank/${questionId}/approve/`, {
      method: 'POST'
    });
  },

  /**
   * Publishes approved questions to a requirement's exam pool.
   */
  async publishExam(requirementId, questionIds) {
    return apiFetch('api/hr/question-bank/publish/', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: Number(requirementId),
        question_ids: questionIds.map(Number)
      })
    });
  }
};

export default hrService;
