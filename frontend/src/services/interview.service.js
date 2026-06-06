import { apiFetch } from './api';
import {
  adaptInterviewCandidateList,
  adaptInterviewList
} from './adapters/interview.adapter';

export const interviewService = {
  /**
   * Fetches the list of candidates eligible for interview scheduling.
   * @returns {Promise<Array>}
   */
  async getCandidatesForInterview() {
    const data = await apiFetch('api/hr/interview-candidates/');
    return adaptInterviewCandidateList(data?.candidates);
  },

  /**
   * Schedules an interview for a candidate.
   * @param {number} mapId
   * @param {string} interviewDatetime - ISO datetime string
   * @param {string} [interviewer]
   */
  async scheduleInterview(mapId, interviewDatetime, interviewer = '') {
    return apiFetch('api/hr/schedule-interview/', {
      method: 'POST',
      body: JSON.stringify({
        map_id: mapId,
        interview_datetime: interviewDatetime,
        interviewer
      })
    });
  },

  /**
   * Fetches the list of all scheduled interviews.
   * @returns {Promise<Array>}
   */
  async getScheduledInterviews() {
    const data = await apiFetch('api/hr/scheduled-interviews/');
    return adaptInterviewList(data?.interviews);
  }
};

export default interviewService;
