/**
 * Generate Payment Completion URL for Team 172
 * 
 * This script generates a payment completion URL for team 172 (TeamZoho)
 * so they can complete their payment setup before approval.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function generateTeam172PaymentUrl() {
  try {
    const teamId = 172;
    
    console.log(`Generating payment completion URL for team ${teamId}...`);
    
    // Call the admin API endpoint to generate payment completion URL
    const response = await fetch(`http://localhost:5000/api/admin/teams/${teamId}/generate-completion-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ Payment completion URL generated successfully!');
    console.log('Team Name:', result.teamName);
    console.log('Team ID:', result.teamId);
    console.log('Manager Email:', result.managerEmail);
    console.log('Setup Intent ID:', result.setupIntentId);
    console.log('\n📋 Payment Completion URL:');
    console.log(result.completionUrl);
    
    console.log('\n📧 Instructions:');
    console.log('1. Copy the payment completion URL above');
    console.log('2. Send it to the team manager at:', result.managerEmail || 'bperdomo@zoho.com');
    console.log('3. Once they complete payment setup, try approving the team again');
    
    return result.completionUrl;
    
  } catch (error) {
    console.error('Error generating payment completion URL:', error);
    throw error;
  }
}

generateTeam172PaymentUrl().catch(console.error);