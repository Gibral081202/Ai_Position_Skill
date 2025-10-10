// API Configuration for Google Gemini Service
// Prefer environment variables for secrets when available
const ENV_API_KEY = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GEMINI_API_KEY)
  ? process.env.REACT_APP_GEMINI_API_KEY
  : undefined;

export const API_CONFIG = {
  // Google Gemini API endpoint
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  
  // API Key (prefer env var in production; fallback provided for dev/testing)
  API_KEY: ENV_API_KEY || 'AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4',
  
  // Model settings
  MODEL_NAME: 'gemini-2.5-flash',
  
  // Rate limiting settings
  RATE_LIMIT_DELAY: 1000, // 1 second between requests (in milliseconds)
  MAX_RETRIES: 3,
  
  // Fallback settings
  USE_MOCK_DATA_ON_ERROR: false,
  MOCK_DATA_DELAY: 1000, // Delay to simulate processing (in milliseconds)
};

// Error messages
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED: 'API quota exceeded. Using offline data.',
  RATE_LIMIT: 'Rate limit reached. Please wait before trying again.',
  NETWORK_ERROR: 'Network error. Using offline data.',
  INVALID_RESPONSE: 'Invalid response from API. Using offline data.',
  GENERAL_ERROR: 'An error occurred. Using offline data.',
  GEMINI_NOT_AVAILABLE: 'Gemini API is not available. Please check your API key and try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  MOCK_DATA_USED: 'Using offline assessment data due to API limitations.',
  MOCK_INSIGHTS_USED: 'Using offline insights data due to API limitations.',
};
