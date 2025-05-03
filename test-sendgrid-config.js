/**
 * SendGrid Email Configuration Test Script
 * 
 * This script tests the new email configuration endpoint 
 * that updates all email templates to use SendGrid and 
 * sets support@matchpro.ai as the sender.
 */

import fetch from 'node-fetch';
import fs from 'fs';

// Helper for API requests with cookies
async function apiRequest(endpoint, method = 'GET', body = null) {
  const cookieContent = loadCookiesFromFile();
  
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  };
  
  // Only add cookies if they exist and are valid
  if (cookieContent && !cookieContent.includes('# Netscape HTTP Cookie File')) {
    options.headers.Cookie = cookieContent;
  }

  console.log(`${method} ${url}`);
  
  const response = await fetch(url, options);
  
  // Save updated cookies
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    saveCookiesToFile(setCookieHeader);
  }
  
  // Parse the response
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return {
    ok: response.ok,
    status: response.status,
    data
  };
}

// Helper to load cookies from file
function loadCookiesFromFile() {
  try {
    if (fs.existsSync('./cookies.txt')) {
      return fs.readFileSync('./cookies.txt', 'utf8');
    }
  } catch (err) {
    console.error('Error loading cookies:', err);
  }
  return '';
}

// Helper to save cookies to file
function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync('./cookies.txt', cookieStr, 'utf8');
  } catch (err) {
    console.error('Error saving cookies:', err);
  }
}

// Login to get authenticated
async function login() {
  // Replace with actual credentials
  const loginData = {
    email: 'bperdomo@zoho.com',
    password: 'password123'
  };
  
  const loginResponse = await apiRequest('/api/auth/login', 'POST', loginData);
  
  if (!loginResponse.ok) {
    console.error('Login failed:', loginResponse.status, loginResponse.data);
    throw new Error('Login failed');
  }
  
  console.log('Login successful');
  return loginResponse;
}

// Test the new email configuration endpoint
async function testEmailConfig() {
  try {
    // First, login to get authenticated
    await login();
    
    // Call the email config endpoint to update all templates
    const response = await apiRequest('/api/admin/email-config', 'POST');
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // If successful, test sending an email
    if (response.ok) {
      console.log('Email configuration updated successfully');
    } else {
      console.error('Failed to update email configuration');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testEmailConfig();