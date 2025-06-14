/**
 * Debug Password Reset Email Issue
 * 
 * This script tests the password reset functionality and diagnoses why emails aren't being sent
 */

import { initiatePasswordReset } from './server/services/passwordResetService.js';

async function debugPasswordReset() {
  console.log('=== Password Reset Debug Test ===');
  
  const testEmails = ['bperdomo@zoho.com', 'bryan@matchpro.ai'];
  
  for (const email of testEmails) {
    console.log(`\nTesting password reset for: ${email}`);
    console.log('----------------------------------------');
    
    try {
      const result = await initiatePasswordReset(email);
      console.log(`Password reset result: ${result}`);
    } catch (error) {
      console.error(`Error during password reset for ${email}:`, error);
      if (error.response) {
        console.error('API Response:', error.response.body);
      }
    }
  }
}

debugPasswordReset().catch(console.error);