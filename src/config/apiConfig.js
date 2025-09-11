// API Configuration for Google Gemini Service
export const API_CONFIG = {
  // Google Gemini API endpoint
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
  
  // API Key
  API_KEY: 'AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4',
  
  // Model settings
  MODEL_NAME: 'gemini-1.5-flash-latest',
  
  // Rate limiting settings
  RATE_LIMIT_DELAY: 1000, // 1 second between requests (in milliseconds)
  MAX_RETRIES: 3,
  
  // Fallback settings
  USE_MOCK_DATA_ON_ERROR: true,
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
