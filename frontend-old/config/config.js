/**
 * Configuration for API endpoints
 * Supports different environments without hardcoding
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// API Configuration
const apiConfig = {
    // Base URL for API calls - automatically detects environment
    getBaseURL: function() {
        if (isDevelopment) {
            return 'http://127.0.0.1:8000/api';
        } else if (isProduction) {
            // For production, use relative URLs or environment-specific URLs
            return '/api'; // This will use the same domain as the frontend
        }
        // Fallback
        return 'http://127.0.0.1:8000/api';
    },

    // Get full URL for specific endpoint
    getURL: function(endpoint) {
        const baseURL = this.getBaseURL();
        // Ensure endpoint starts with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${baseURL}${cleanEndpoint}`;
    },

    // Environment info
    isDevelopment: isDevelopment,
    isProduction: isProduction
};

// Make config globally available
window.apiConfig = apiConfig; 