import { apiFetch } from './api';
import { adaptJobList, adaptJob } from './adapters/job.adapter';

export const jobsService = {
  /**
   * Fetches list of all distinct job position names.
   * @returns {Promise<Array>} List of position names (strings)
   */
  async getPositions() {
    return apiFetch('api/get_positions/');
  },

  /**
   * Fetches predefined recommendations (tech skills, soft skills, education) for a position.
   * @param {string} positionName 
   * @returns {Promise<Object>} { technical_skills, soft_skills, education }
   */
  async getRecommendations(positionName) {
    return apiFetch('api/get_recommendations_for_position/', {
      method: 'POST',
      body: JSON.stringify({ position: positionName }),
    });
  },

  /**
   * Submits a newly created job posting.
   * @param {Object} jobData 
   */
  async submitJob(jobData) {
    return apiFetch('api/submit_job/', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  /**
   * Fetches recent job requirements list.
   * @returns {Promise<Array>} Adapted job requirement list
   */
  async getRecentJobs() {
    const data = await apiFetch('api/get-recent-jobs/');
    return adaptJobList(data);
  },

  /**
   * Fetches all job requirements.
   * @param {boolean} showDeleted
   * @returns {Promise<Array>} Adapted job requirements list
   */
  async getAll(showDeleted = false) {
    const endpoint = showDeleted ? 'api/list_job_requirements/?show_deleted=true' : 'api/list_job_requirements/';
    const data = await apiFetch(endpoint);
    return adaptJobList(data);
  },

  /**
   * Updates the status of a job requirement (ACTIVE, CLOSED, DELETED).
   * @param {number|string} requirementId
   * @param {string} status
   */
  async updateJobStatus(requirementId, status) {
    return apiFetch(`api/jobs/${requirementId}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Fetches details of a specific job requirement.
   * @param {number} requirementId 
   * @returns {Promise<Object>} Adapted job detail object
   */
  async getDetail(requirementId) {
    const data = await apiFetch(`api/get_job_requirement_detail/${requirementId}/`);
    return adaptJob(data);
  },

  /**
   * Assigns an HR recruiter to a job requirement.
   * @param {number|string} requirementId 
   */
  async assignJob(requirementId) {
    return apiFetch('api/hr/assign-job/', {
      method: 'POST',
      body: JSON.stringify({ requirement_id: String(requirementId) }),
    });
  },

  /**
   * Unassigns the recruiter from a job requirement.
   * @param {number|string} requirementId
   */
  async unassignJob(requirementId) {
    return apiFetch('api/hr/unassign-job/', {
      method: 'POST',
      body: JSON.stringify({ requirement_id: String(requirementId) }),
    });
  },

  /**
   * Reassigns a job requirement to another HR recruiter (Admin only).
   * @param {number|string} requirementId
   * @param {number|string} targetUserId
   */
  async reassignJob(requirementId, targetUserId) {
    return apiFetch('api/hr/assign-job/', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: String(requirementId),
        target_user_id: Number(targetUserId),
      }),
    });
  }
};
export default jobsService;
