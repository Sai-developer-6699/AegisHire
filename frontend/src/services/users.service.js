import { apiFetch } from './api';
import { adaptUserList, adaptUser } from './adapters/user.adapter';

export const usersService = {
  /**
   * Fetches all registered users, filtered optionally by role and status.
   * @param {string} role 
   * @param {string} status 
   * @returns {Promise<Array>} Adapted user objects list
   */
  async getAll(role = '', status = '') {
    const queryParams = new URLSearchParams();
    if (role) queryParams.append('role', role);
    if (status) queryParams.append('status', status);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const data = await apiFetch(`api/get-users/${queryString}`);
    return adaptUserList(data);
  },

  /**
   * Registers a new user.
   * @param {Object} userData 
   */
  async register(userData) {
    return apiFetch('api/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Deletes a user by their unique ID.
   * @param {number} userId 
   */
  async delete(userId) {
    return apiFetch(`api/delete-user/${userId}/`, {
      method: 'DELETE',
    });
  }
};
export default usersService;
