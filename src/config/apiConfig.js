// API Configuration for OpenAI GPT Service
// Prefer environment variables for secrets when available
const ENV_API_KEY = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_OPENAI_API_KEY)
  ? process.env.REACT_APP_OPENAI_API_KEY
  : undefined;

export const API_CONFIG = {
  // OpenAI GPT API endpoint
  API_URL: 'https://api.openai.com/v1/chat/completions',
  
  // API Key (MUST be set via environment variable REACT_APP_OPENAI_API_KEY)
  API_KEY: ENV_API_KEY || (() => {
    console.error('❌ OpenAI API key not found! Set REACT_APP_OPENAI_API_KEY environment variable.');
    throw new Error('OpenAI API key is required. Please set REACT_APP_OPENAI_API_KEY environment variable.');
  })(),
  
  // Model settings - using gpt-4o-mini (fastest available OpenAI model)
  MODEL_NAME: 'gpt-4o-mini',
  
  // Rate limiting settings
  RATE_LIMIT_DELAY: 1000, // 1 second between requests (in milliseconds)
  MAX_RETRIES: 3,
  
  // Fallback settings
  // No mock data settings - system uses only real GPT-4o-mini API responses
};

// Error messages
export const ERROR_MESSAGES = {
  QUOTA_EXCEEDED: 'Kuota GPT-4o-mini API terlampaui. Silakan tunggu atau periksa billing.',
  RATE_LIMIT: 'Batas permintaan tercapai. Silakan tunggu sebelum mencoba lagi.',
  NETWORK_ERROR: 'Kesalahan jaringan saat mengakses GPT-4o-mini API.',
  INVALID_RESPONSE: 'Format respons dari GPT-4o-mini API tidak valid.',
  GENERAL_ERROR: 'Terjadi kesalahan dalam mengakses GPT-4o-mini API.',
  GPT_NOT_AVAILABLE: 'GPT-4o-mini API tidak tersedia. Silakan periksa API key dan coba lagi.',
};

// Success messages - only real GPT-4o-mini API responses
export const SUCCESS_MESSAGES = {
  API_RESPONSE_SUCCESS: 'Data berhasil diambil dari GPT-4o-mini API.',
};
