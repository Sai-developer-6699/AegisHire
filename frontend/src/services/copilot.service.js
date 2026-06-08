import { apiFetch } from './api';

export const copilotService = {
  /**
   * Sends a message to the AI Recruiter Copilot.
   * @param {string} message - Recruiter's question
   * @param {number|string|null} requirementId - Associated job requirement ID (optional)
   * @returns {Promise<Object>} { reply: string }
   */
  async sendMessage(message, requirementId = null) {
    return apiFetch('api/copilot/chat/', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context: {
          requirement_id: requirementId ? Number(requirementId) : null
        }
      })
    });
  }
};

export default copilotService;
