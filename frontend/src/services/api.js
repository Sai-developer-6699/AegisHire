import { toast } from 'sonner';

let _logoutCallback = null;

/**
 * Registers a callback function to run when a 401 Unauthorized response is received.
 * This is typically hooked up to the AuthContext logout function to force auto-logout.
 * @param {Function} fn 
 */
export function registerLogoutCallback(fn) {
  _logoutCallback = fn;
}

/**
 * Utility to extract the Django CSRF token from the browser cookie.
 * @returns {string} CSRF token
 */
function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find(row => row.trim().startsWith('csrftoken='))
    ?.split('=')[1] ?? '';
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Centered fetch utility that configures credentials, CSRF, and autologout.
 * @param {string} endpoint - The relative API path (e.g. 'api/hr/recent-resumes/')
 * @param {Object} options - Standard fetch options overrides
 */
export async function apiFetch(endpoint, options = {}) {
  // Normalize the endpoint slash configuration (ensure it ends with / for Django urls compatibility)
  let normalizedEndpoint = endpoint;
  if (!normalizedEndpoint.endsWith('/') && !normalizedEndpoint.includes('?')) {
    normalizedEndpoint = `${normalizedEndpoint}/`;
  }

  const isFormData = options.body instanceof FormData;

  const url = BASE_URL ? `${BASE_URL}/${normalizedEndpoint}` : `/${normalizedEndpoint}`;
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      'X-CSRFToken': getCsrfToken(),
      ...options.headers,
    },
    ...options,
  });

  // Centralized session timeout / session invalidation check
  if (response.status === 401 && !normalizedEndpoint.startsWith('login')) {
    if (_logoutCallback) {
      _logoutCallback();
    }
    // Return empty promise to halt execution chain in UI component
    return new Promise(() => {});
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.detail || errorData.message || 'Unknown error';
    
    if (response.status === 403) {
      toast.error(errorMessage === 'Forbidden' ? "Access denied — you don't have permission to access this resource." : errorMessage);
    } else if (response.status === 400) {
      toast.error(errorMessage);
    }
    
    throw { status: response.status, ...errorData, message: errorMessage };
  }

  if (response.status === 204) return null;
  return response.json();
}
