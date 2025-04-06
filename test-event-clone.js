/**
 * Test script for cloning an event
 * This script tests the event cloning endpoint
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const REPLIT_URL = process.env.REPLIT_URL || 'http://localhost:5000';
const API_URL = `${REPLIT_URL}`;

// Cookie management
function loadCookiesFromFile() {
  try {
    if (fs.existsSync('cookies.txt')) {
      return fs.readFileSync('cookies.txt', 'utf8');
    }
  } catch (error) {
    console.error('Error loading cookies:', error);
  }
  return '';
}

function saveCookiesToFile(cookieStr) {
  try {
    fs.writeFileSync('cookies.txt', cookieStr);
  } catch (error) {
    console.error('Error saving cookies:', error);
  }
}

// Helper function for making API requests
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const responseBody = await response.text();
    
    // Parse JSON response if possible
    let data;
    try {
      data = JSON.parse(responseBody);
    } catch (e) {
      data = responseBody;
    }
    
    // Get cookies
    const setCookieHeader = response.headers.get('set-cookie');
    let cookies = setCookieHeader || '';
    
    // Extract the cookie value
    if (cookies) {
      // Parse the cookie string
      const cookieParts = cookies.split(';');
      if (cookieParts.length > 0) {
        cookies = cookieParts[0]; // Just get the main part: connect.sid=value
        console.log('Extracted cookie:', cookies);
      }
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      cookies
    };
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Login first to get a valid session
async function login() {
  console.log('Logging in as admin...');
  
  const loginResponse = await apiRequest('/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'Admin123!'
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
  }
  
  console.log('Login successful!');
  saveCookiesToFile(loginResponse.cookies);
  return loginResponse.cookies;
}

// Main test function
async function testEventClone() {
  try {
    // First log in to get authentication cookies
    const cookies = await login();
    
    // Get a list of events to select one for cloning
    console.log('Fetching events...');
    const eventsResponse = await apiRequest('/api/admin/events', 'GET', null, cookies);
    
    if (!eventsResponse.ok) {
      throw new Error(`Failed to fetch events: ${JSON.stringify(eventsResponse.data)}`);
    }
    
    if (!eventsResponse.data || !eventsResponse.data.events || eventsResponse.data.events.length === 0) {
      throw new Error('No events found to clone. Create an event first.');
    }
    
    // Select the first event to clone
    const sourceEvent = eventsResponse.data.events[0];
    console.log(`Selected event to clone: ${sourceEvent.name} (ID: ${sourceEvent.id})`);
    
    // Clone the event
    console.log('Cloning event...');
    const cloneResponse = await apiRequest(`/api/admin/events/${sourceEvent.id}/clone`, 'POST', {
      name: `${sourceEvent.name} - Clone ${new Date().toISOString().split('T')[0]}`
    }, cookies);
    
    console.log('Clone response:', cloneResponse);
    
    if (!cloneResponse.ok) {
      throw new Error(`Failed to clone event: ${JSON.stringify(cloneResponse.data)}`);
    }
    
    console.log(`Event cloned successfully!`);
    console.log(`New event ID: ${cloneResponse.data.id}`);
    console.log(`New event name: ${cloneResponse.data.event.name}`);

    // Fetch the cloned event to verify it exists
    console.log('Fetching cloned event...');
    const clonedEventResponse = await apiRequest(`/api/admin/events/${cloneResponse.data.id}/edit`, 'GET', null, cookies);
    
    if (!clonedEventResponse.ok) {
      throw new Error(`Failed to fetch cloned event: ${JSON.stringify(clonedEventResponse.data)}`);
    }
    
    console.log('Cloned event details:', clonedEventResponse.data);
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testEventClone();