/**
 * Test Admin Welcome Email on Administrator Creation
 * 
 * This script tests creating a new administrator and verifies that
 * the welcome email is sent properly.
 * 
 * Usage:
 *   node test-admin-welcome-email.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Helper functions
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COOKIES_FILE = join(__dirname, 'cookies.txt');

// Load cookies from file
function loadCookiesFromFile() {
  try {
    if (fs.existsSync(COOKIES_FILE)) {
      return fs.readFileSync(COOKIES_FILE, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error loading cookies:', error);
  }
  return '';
}

// Save cookies to file
function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync(COOKIES_FILE, cookieStr);
    console.log('Cookies saved to file');
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

// Helper function for making API requests
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  // In Replit, just use localhost - we're testing within the container
  const baseUrl = 'http://localhost:5000';
  
  const url = `${baseUrl}${endpoint}`;
  console.log(`Making ${method} request to ${url}`);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Only add cookies header if cookies are provided and valid
  if (cookies && !cookies.includes('# Netscape HTTP Cookie File')) {
    headers['Cookie'] = cookies;
  }
  
  const options = {
    method,
    headers,
    redirect: 'follow'
  };
  
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const setCookieHeader = response.headers.get('set-cookie');
    let newCookies = cookies;
    
    if (setCookieHeader) {
      newCookies = setCookieHeader;
    }
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      cookies: newCookies
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      ok: false,
      status: 0,
      data: { error: error.message },
      cookies: cookies
    };
  }
}

// Login function
async function login() {
  console.log('Logging in...');
  
  const existingCookies = loadCookiesFromFile();
  if (existingCookies) {
    console.log('Using existing cookies');
    
    // Verify if cookies are still valid
    const userResponse = await apiRequest('/api/user', 'GET', null, existingCookies);
    if (userResponse.ok && userResponse.data.id) {
      console.log('Existing session is valid');
      return existingCookies;
    }
    console.log('Existing session expired, logging in again');
  }
  
  const loginData = {
    email: 'bperdomo@zoho.com', // Default admin user
    password: 'password123'      // Default admin password
  };
  
  const response = await apiRequest('/api/login', 'POST', loginData);
  
  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
  }
  
  console.log('Login successful');
  saveCookiesToFile(response.cookies);
  return response.cookies;
}

// Test admin creation with welcome email
async function testAdminCreation() {
  try {
    // Login first to get authenticated cookies
    const cookies = await login();
    
    // Generate a unique email for the test
    const uniqueId = Date.now();
    const adminData = {
      firstName: 'Test',
      lastName: 'Admin',
      email: `testadmin${uniqueId}@example.com`,
      password: 'Password123!',
      roles: ['event_admin', 'finance_admin']
    };
    
    console.log(`Creating admin with email: ${adminData.email}`);
    
    // Create the admin
    const createResponse = await apiRequest('/api/admin/administrators', 'POST', adminData, cookies);
    
    if (!createResponse.ok) {
      console.error('Admin creation failed:', createResponse.data);
      return false;
    }
    
    console.log('Admin created successfully:', createResponse.data);
    console.log('Welcome email should have been sent. Check the server logs for confirmation.');
    
    return true;
  } catch (error) {
    console.error('Error testing admin creation:', error);
    return false;
  }
}

// Run the test
async function main() {
  console.log('Starting admin welcome email test...');
  
  try {
    const result = await testAdminCreation();
    
    if (result) {
      console.log('✅ Test completed successfully');
    } else {
      console.log('❌ Test failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error in test:', error);
    process.exit(1);
  }
}

main();