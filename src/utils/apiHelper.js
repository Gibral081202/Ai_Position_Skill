/**
 * API Utility for handling correct API paths in production
 * Handles the /mining-hr/ base path for production deployment
 */

// Get the correct API base URL
const getApiBaseUrl = () => {
  // In production, we're served from /mining-hr/, so API calls should go to /mining-hr/api/
  // In development, API calls go directly to /api/
  const publicUrl = process.env.PUBLIC_URL || '';
  
  // If we have a public URL (like /mining-hr), append it to API calls
  if (publicUrl && publicUrl !== '/') {
    return `${publicUrl}/api`;
  }
  
  // Default to /api for development
  return '/api';
};

// Helper function to make API calls with correct base URL
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;
  
  console.log(`📡 API Call: ${fullUrl}`);
  
  return fetch(fullUrl, options);
};

// Helper to get full API URL for a given endpoint
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

// Export the base URL getter for direct use
export { getApiBaseUrl };

export default {
  call: apiCall,
  getUrl: getApiUrl,
  getBaseUrl: getApiBaseUrl
};