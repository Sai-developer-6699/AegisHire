import { apiFetch } from './api';
import { adaptResumeList, adaptResume } from './adapters/resume.adapter';

export const resumesService = {
  /**
   * Uploads candidate resume file along with details (multipart/form-data).
   * @param {FormData} formData - Contains name, email, phone, and resume file
   */
  async upload(formData) {
    return apiFetch('api/hr/upload/', {
      method: 'POST',
      body: formData, // Skip JSON content-type (handled by apiFetch FormData check)
    });
  },

  /**
   * Fetches recent candidate resumes list.
   * @param {number} limit 
   * @returns {Promise<Array>} Adapted resume list
   */
  async getRecent(limit = 6) {
    const data = await apiFetch(`api/hr/recent-resumes/?limit=${limit}`);
    return adaptResumeList(data?.resumes);
  },

  /**
   * Evaluates pending resumes against a job requirement using AI.
   * @param {number} requirementId 
   * @param {number} limit - Batch size limit
   */
  async evaluate(requirementId, limit = 50) {
    return apiFetch('api/evaluate/', {
      method: 'POST',
      body: JSON.stringify({ requirement_id: requirementId, limit }),
    });
  },

  /**
   * Fetches evaluated resumes with their scores for a requirement.
   * @param {number} requirementId 
   * @returns {Promise<Array>} Adapted resume list
   */
  async getEvaluated(requirementId) {
    const data = await apiFetch(`api/hr/resumes/${requirementId}/`);
    return adaptResumeList(data?.resumes);
  },

  /**
   * Submits selected candidates to the shortlist.
   * @param {Array} shortlistData - [{ resume_id, requirement_id }, ...]
   */
  async shortlist(shortlistData) {
    return apiFetch('api/hr/shortlist/', {
      method: 'POST',
      body: JSON.stringify(shortlistData),
    });
  },

  /**
   * Fetches AI-generated match breakdown, skill matrix, and recommendation details.
   */
  async getAiDetails(resumeId, requirementId) {
    return apiFetch(`api/hr/candidates/${resumeId}/ai-details/?requirement_id=${requirementId}`);
  }
};
export default resumesService;
