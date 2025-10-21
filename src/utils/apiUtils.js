/**
 * API Configuration and Utility Functions
 * Handles different API base URLs for development and production
 */

// Determine the base API URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production by looking at the URL or environment
  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    window.location.hostname === 'wecare.techconnect.co.id' ||
    window.location.pathname.startsWith('/mining-hr');
  
  // In production, API calls should go to the same origin with /mining-hr/api prefix
  if (isProduction) {
    console.log('🏭 Production mode detected - using /mining-hr/api base URL');
    return '/mining-hr/api';
  }
  
  // In development, use the proxy or direct localhost
  console.log('🔧 Development mode detected - using /api base URL');
  return '/api';
};

// Create a fetch wrapper that handles the base URL
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`🌐 API Call: ${url}`);
  console.log(`🌐 Current location: ${window.location.href}`);
  console.log(`🌐 Base URL: ${baseUrl}`);
  console.log(`🌐 Endpoint: ${endpoint}`);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorData);
    console.error(`❌ Failed URL: ${url}`);
    console.error(`❌ Response headers:`, response.headers);
    throw new Error(`Server responded with ${response.status}: ${errorData}`);
  }
  
  return response;
};

// Export the base URL getter for direct use
export const API_BASE_URL = getApiBaseUrl();

export default { apiCall, API_BASE_URL };