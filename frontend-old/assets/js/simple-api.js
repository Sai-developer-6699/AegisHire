/**
 * Simple API Functions
 * Direct fetch calls to Django backend
 * Uses config.js for flexible URL configuration
 */

// Simple POST request
async function simplePost(endpoint, data) {
    try {
        // Use config for URL instead of hardcoding
        const url = apiConfig.getURL(endpoint);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Simple PUT request
async function simplePut(endpoint, data) {
    try {
        // Use config for URL instead of hardcoding
        const url = apiConfig.getURL(endpoint);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Simple GET request
async function simpleGet(endpoint) {
    try {
        // Use config for URL instead of hardcoding
        const url = apiConfig.getURL(endpoint);
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Make functions globally available
window.simplePost = simplePost;
window.simplePut = simplePut;
window.simpleGet = simpleGet; 