/**
 * Safe Registration Fees Middleware
 * 
 * This middleware ensures registration fees are properly handled
 * even when they're missing for certain age groups.
 */

function safeRegistrationFeesMiddleware(req, res, next) {
  // Only process POST requests to the registration endpoint
  if (req.method === 'POST' && req.path.match(/\/api\/events\/\d+\/register-team/)) {
    console.log('Safe registration fees middleware processing request');

    // Ensure registration fee is a valid number or default to 0
    if (req.body.registrationFee === undefined || req.body.registrationFee === null) {
      console.log('Setting default registration fee to 0');
      req.body.registrationFee = 0;
    }

    // Ensure selectedFeeIds is a valid array or default to empty array
    if (!Array.isArray(req.body.selectedFeeIds)) {
      console.log('Setting default selectedFeeIds to empty array');
      req.body.selectedFeeIds = [];
    }

    // Ensure totalAmount is a valid number or default to 0
    if (req.body.totalAmount === undefined || req.body.totalAmount === null) {
      console.log('Setting default totalAmount to 0');
      req.body.totalAmount = 0;
    }

    // Properly convert addRosterLater to boolean
    req.body.addRosterLater = req.body.addRosterLater === true || req.body.addRosterLater === 'true';
    console.log('Normalized addRosterLater value:', req.body.addRosterLater);
  }

  // Continue to the next middleware/route handler
  next();
}

module.exports = safeRegistrationFeesMiddleware;