import { apiFetch } from './api';

export const noticesService = {
  /**
   * Fetches unread notices matching the logged-in user's role or user ID.
   * @returns {Promise<Array>} List of unread notices
   */
  async getNotices() {
    return apiFetch('api/notices/');
  },

  /**
   * Marks a specific notice as read.
   * @param {number|string} noticeId 
   */
  async markAsRead(noticeId) {
    return apiFetch(`api/notices/${noticeId}/read/`, {
      method: 'POST',
    });
  }
};

export default noticesService;
