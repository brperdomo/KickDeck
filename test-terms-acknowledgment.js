/**
 * Test Terms Acknowledgment Flow
 * This script tests the generation and download of terms acknowledgment PDFs,
 * ensuring that submitter information is correctly captured.
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for API requests
const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port
const API_BASE = `${BASE_URL}/api`;

// Test team ID - replace with an actual team ID from your database
const TEST_TEAM_ID = 15; // Use a team ID that exists in your database

// Cookies storage for session maintenance
let cookies = '';

/**
 * Helper function for making API requests with cookie support
 * @param {string} endpoint - API endpoint, without the base URL
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} data - Request body data (for POST, PUT, etc.)
 * @param {string} cookieStr - Cookie string for authentication
 * @returns {Promise<{ok: boolean, status: number, data: any, cookies: string}>}
 */
async function apiRequest(endpoint, method = 'GET', data = null, cookieStr = '') {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`Making ${method} request to: ${url}`);
    
    const headers = {};
    if (cookieStr) {
      headers.Cookie = cookieStr;
    }
    
    const response = await axios({
      method,
      url,
      data,
      headers,
      validateStatus: () => true, // Don't throw on error status codes
    });
    
    // Extract cookies from response if available
    const responseCookies = response.headers['set-cookie'];
    const newCookies = responseCookies ? responseCookies.join('; ') : '';
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      cookies: newCookies || cookieStr,
    };
  } catch (error) {
    console.error('API request error:', error.message);
    return {
      ok: false,
      status: 0,
      data: { error: error.message },
      cookies: cookieStr,
    };
  }
}

/**
 * Test function for terms acknowledgment flow
 */
async function testTermsAcknowledgment() {
  console.log('Starting terms acknowledgment test');
  
  try {
    // Step 1: Login as admin
    console.log('Step 1: Authenticating as admin');
    const loginResponse = await apiRequest('/auth/login', 'POST', {
      email: 'admin@matchpro.ai',  // Admin user
      password: 'Admin123!'        // Admin password
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
    }
    
    cookies = loginResponse.cookies;
    console.log('Authenticated successfully');
    
    // Step 2: Generate terms acknowledgment document
    console.log(`Step 2: Generating terms acknowledgment document for team ${TEST_TEAM_ID}`);
    const generateResponse = await apiRequest(`/teams/${TEST_TEAM_ID}/terms-acknowledgment/generate`, 'POST', null, cookies);
    
    if (!generateResponse.ok) {
      throw new Error(`Document generation failed: ${JSON.stringify(generateResponse.data)}`);
    }
    
    console.log('Document generated successfully');
    console.log('Download URL:', generateResponse.data.downloadUrl);
    
    // Step 3: Download the document
    console.log('Step 3: Downloading terms acknowledgment document');
    const downloadUrl = generateResponse.data.downloadUrl;
    const downloadPath = path.join(__dirname, 'terms_acknowledgment_test.pdf');
    
    // Download the file using axios
    const pdfResponse = await axios({
      method: 'GET',
      url: BASE_URL + downloadUrl,
      headers: {
        Cookie: cookies,
      },
      responseType: 'stream',
    });
    
    const writer = fs.createWriteStream(downloadPath);
    pdfResponse.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`Document downloaded successfully to: ${downloadPath}`);
    
    return {
      success: true,
      message: 'Terms acknowledgment test completed successfully',
      downloadPath: downloadPath,
      downloadUrl: downloadUrl
    };
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testTermsAcknowledgment()
  .then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });

// Export for ESM
export { testTermsAcknowledgment };