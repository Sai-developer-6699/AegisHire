/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Default API configuration
const DEFAULT_API_CONFIG = {
    protocol: 'http',
    host: '127.0.0.1',
    port: '8000',
    baseUrl: 'http://127.0.0.1:8000'
};

// API Configuration Class
class APIConfig {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from environment or use defaults
     */
    loadConfig() {
        // Try to get from window object (set by Django template)
        if (window.API_CONFIG) {
            return window.API_CONFIG;
        }

        // Try to get from localStorage (if set by user)
        const storedConfig = localStorage.getItem('api_config');
        if (storedConfig) {
            try {
                return JSON.parse(storedConfig);
            } catch (e) {
                console.warn('Invalid stored API config, using defaults');
            }
        }

        // Use defaults
        return DEFAULT_API_CONFIG;
    }

    /**
     * Get the base URL for API calls
     */
    getBaseURL() {
        return this.config.baseUrl;
    }

    /**
     * Get full URL for an endpoint
     */
    getURL(endpoint) {
        // Remove leading slash if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.config.baseUrl}/${cleanEndpoint}`;
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update localStorage
        localStorage.setItem('api_config', JSON.stringify(this.config));
        
        console.log('API configuration updated:', this.config);
    }

    /**
     * Reset to defaults
     */
    resetToDefaults() {
        this.config = DEFAULT_API_CONFIG;
        localStorage.removeItem('api_config');
        console.log('API configuration reset to defaults');
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

// Create global instance
const apiConfig = new APIConfig();

// Helper function for making API calls
async function apiCall(endpoint, options = {}) {
    const url = apiConfig.getURL(endpoint);
    
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIConfig, apiConfig, apiCall };
} 