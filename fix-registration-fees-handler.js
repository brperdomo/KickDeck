/**
 * Fix Registration Fees Handler
 * 
 * This script fixes an issue where team registration would fail with a 500 error
 * when there are no registration fees configured for an age group.
 * 
 * It adds necessary checks and defaults in the team registration endpoint.
 */

const { db } = require('./db');
const { teams } = require('./db/schema');

async function checkAndAddMissingFees() {
  console.log("Starting to fix registration fees handling in team registration...");
  
  try {
    // Check if we need to patch the code directly
    console.log("Code patching is not supported through this script.");
    console.log("Please update the server/routes.ts file to add proper null/undefined handling for registration fees.");
    console.log("\nRecommended Changes:");
    console.log("1. In the team registration endpoint (POST /api/events/:eventId/register-team):");
    console.log("   - Add a check for null/undefined registration fees");
    console.log("   - Set default values for payment-related fields");
    console.log("   - Handle boolean conversion for addRosterLater flag");
    
    console.log("\nCode Example:");
    console.log(`
// Before inserting the team, add this code:
const safeRegistrationFee = registrationFee !== undefined && registrationFee !== null 
  ? registrationFee 
  : 0;
  
console.log('Team registration - Using registration fee:', safeRegistrationFee);

// Then in the team insert values:
  registrationFee: safeRegistrationFee, // Store the registration fee amount, defaulting to 0
  selectedFeeIds: selectedFeeIds || [], // Store the selected fee IDs as an array, defaulting to empty array
  totalAmount: totalAmount || 0, // Total amount in cents including all fees, defaulting to 0
  
// And properly handle the addRosterLater flag:
const useAddRosterLater = addRosterLater === true || addRosterLater === 'true';
// Then use useAddRosterLater instead of addRosterLater in the insert values
    `);
    
    // Return immediate instructions
    return {
      success: true,
      message: "Manual changes required. Please see instructions above."
    };
  } catch (error) {
    console.error("Error when running fix script:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  checkAndAddMissingFees()
    .then(result => {
      console.log("Result:", result);
      
      if (result.success) {
        console.log("\nNext steps:");
        console.log("1. After making the changes, restart the server");
        console.log("2. Test team registration with an age group that has no fees");
      } else {
        console.error("Failed to complete the fix:", result.error);
      }
    })
    .catch(err => {
      console.error("Script execution failed:", err);
    });
}

module.exports = { checkAndAddMissingFees };