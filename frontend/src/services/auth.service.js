import { apiFetch } from './api';
import { adaptSession } from './adapters/auth.adapter';

export const authService = {
  /**
   * Performs credentials verification and establishes a session.
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<Object>} { message, roleid, userid }
   */
  async login(username, password) {
    return apiFetch('login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Validates if the user has an active session cookie on the server.
   * @returns {Promise<Object>} Adapted session object { userid, roleid, username }
   */
  async checkSession() {
    const data = await apiFetch('api/check_session/');
    return adaptSession(data);
  },

  /**
   * Logs out the user on the server and flushes session data.
   */
  async logout() {
    return apiFetch('api/logout/', {
      method: 'POST',
    });
  }
};
