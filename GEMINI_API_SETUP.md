# Google Gemini API Setup Guide

## Overview
This application uses Google's Gemini AI API for mining industry position qualification assessment. The system includes comprehensive error handling and fallback mechanisms to handle connection issues and provide offline functionality with mining industry-specific mock data.

## Google Gemini API Setup

### 1. Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. API Key Configuration
The application is pre-configured with the API key:
```
AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4
```

### 3. Verify API Access
Test your API key by making a simple request:
```bash
curl -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4'
```

## Configuration

### API Configuration
The application is configured to use Google Gemini by default:

```javascript
// Google Gemini API endpoint
API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',

// API Key
API_KEY: 'AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4',

// Model settings
MODEL_NAME: 'gemini-1.5-flash-latest',

// Rate limiting settings
RATE_LIMIT_DELAY: 1000, // 1 second between requests
```

## Error Handling Features

### 1. Connection Detection
- Automatic detection when Gemini API is unavailable
- Graceful fallback to mining industry-specific mock data
- User notification when using offline mode

### 2. Retry Logic
- Exponential backoff (1s, 2s, 4s delays)
- Maximum 3 retry attempts
- Rate limiting and quota error handling

### 3. Mining Industry Fallback System
- Seamless fallback to mining-specific mock data when Gemini is unavailable
- Realistic mining industry mock data based on position level and mining sector
- User notification when using offline mining industry data

### 4. Error Types Handled
- ✅ Gemini API not available
- ✅ API quota exceeded
- ✅ Rate limiting
- ✅ Network errors
- ✅ Invalid API responses
- ✅ General API errors

## Configuration Options

### Rate Limiting
```javascript
RATE_LIMIT_DELAY: 1000, // 1 second between requests
```

### Retry Settings
```javascript
MAX_RETRIES: 3, // Maximum retry attempts
```

### Model Settings
```javascript
MODEL_NAME: 'gemini-1.5-flash-latest', // Gemini model to use
API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
```

### Fallback Settings
```javascript
USE_MOCK_DATA_ON_ERROR: true, // Enable fallback to mining industry mock data
MOCK_DATA_DELAY: 1000, // Delay to simulate processing
```

## Troubleshooting

### Common Issues

#### 1. "API Key Invalid" Error
**Solution**: 
- Verify your API key is correct
- Check if API key has proper permissions
- Ensure Gemini API is enabled for your Google account

#### 2. "Quota Exceeded" Error
**Solution**:
- Check your API usage limits in Google AI Studio
- Wait for quota reset (usually daily)
- Consider upgrading your API plan

#### 3. "Rate Limit" Error
**Solution**:
- Application automatically handles rate limiting
- Wait a few seconds between requests
- Check if you're making too many concurrent requests

### Mining Industry Mock Data

When the Gemini API is unavailable, the system automatically switches to mining industry-specific mock data that includes:

1. **Position-Level Appropriate Ratings**: Realistic qualification ratings based on mining industry standards
2. **Mining Sector Adjustments**: Specific adjustments for different mining sectors (Coal, Gold, Copper, etc.)
3. **Safety Training Focus**: Emphasis on mining safety requirements (MSHA, etc.)
4. **Mining-Specific Tools**: Assessment of mining software and equipment proficiency
5. **Industry Salary Ranges**: Realistic mining industry compensation data

### Best Practices

1. **Monitor API Usage**: Keep track of your API calls to avoid quota limits
2. **Handle Errors Gracefully**: The system automatically falls back to offline mode
3. **Test Connectivity**: Verify API access before important assessments
4. **Keep API Key Secure**: Protect your API key from unauthorized use

## Testing

### Test Gemini Connection
```javascript
// Test your Gemini API connection
const testGemini = async () => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBiwOLi2PtSl-qndmfy2mxAe_slbFm_EM4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, test mining assessment'
          }]
        }]
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Gemini working:', data);
    } else {
      console.error('Gemini error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Gemini error:', error);
  }
};
```

### Test Mining Industry Fallback System
1. Disable internet connection or use invalid API key
2. Verify mining-specific mock data is generated
3. Check that mining industry user notifications appear

## Performance Considerations

### API Limits
- **Free Tier**: 15 requests per minute, 1,500 requests per day
- **Paid Tier**: Higher limits available
- **Response Time**: Typically 1-3 seconds per request

### Optimization Tips
- Use rate limiting to avoid quota exhaustion
- Cache results when appropriate
- Consider batching related requests
- Monitor API usage patterns

## Support

For Gemini API-related issues:
- [Google AI Studio Documentation](https://makersuite.google.com/app/home)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Developer Community](https://developers.googleblog.com/2023/12/gemini-api-developer-preview.html)

For Mining Industry Specific Features:
- The application includes comprehensive mining industry mock data
- Covers all major mining sectors and position levels
- Provides realistic salary ranges and industry insights
