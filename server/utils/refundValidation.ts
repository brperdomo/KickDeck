/**
 * Refund Validation Utilities
 * Ensures refunds can only be processed through tournament Connect accounts
 */

import Stripe from 'stripe';

/**
 * Validates that a payment has the required Connect account metadata for refund processing
 * @param paymentIntent - The Stripe PaymentIntent object
 * @returns Validation result with Connect account ID or error details
 */
export function validateRefundEligibility(paymentIntent: Stripe.PaymentIntent): {
  isEligible: boolean;
  connectAccountId?: string;
  error?: string;
  details?: string;
} {
  // Check payment intent metadata for Connect account ID
  const connectAccountId = paymentIntent.metadata?.connectAccountId;
  
  if (!connectAccountId || connectAccountId.trim() === '') {
    return {
      isEligible: false,
      error: 'No Connect account found',
      details: `Payment intent ${paymentIntent.id} does not have Connect account metadata. This payment was likely processed before the Connect account refund system was implemented. Refunds can only be processed through tournament Connect accounts to prevent negative balances on the main platform account.`
    };
  }

  // Validate Connect account ID format
  if (!connectAccountId.startsWith('acct_')) {
    return {
      isEligible: false,
      error: 'Invalid Connect account format',
      details: `Connect account ID "${connectAccountId}" does not follow Stripe Connect account format (should start with 'acct_')`
    };
  }

  return {
    isEligible: true,
    connectAccountId
  };
}

/**
 * Creates a detailed error message for refund failures
 * @param paymentIntentId - The payment intent ID
 * @param teamId - The team ID (if available)
 * @param reason - The reason for failure
 * @returns Formatted error message
 */
export function createRefundErrorMessage(
  paymentIntentId: string, 
  teamId?: string, 
  reason?: string
): string {
  const baseMessage = `Refund failed for payment intent ${paymentIntentId}`;
  const teamInfo = teamId ? ` (Team ID: ${teamId})` : '';
  const reasonInfo = reason ? `: ${reason}` : '';
  
  return `${baseMessage}${teamInfo}${reasonInfo}. Refunds require tournament Connect account metadata to prevent negative balances on the main platform account.`;
}

/**
 * Logs refund validation results for audit purposes
 * @param paymentIntentId - The payment intent ID
 * @param validation - The validation result
 */
export function logRefundValidation(
  paymentIntentId: string, 
  validation: ReturnType<typeof validateRefundEligibility>
): void {
  if (validation.isEligible) {
    console.log(`✅ Refund validation passed for ${paymentIntentId} - Connect account: ${validation.connectAccountId}`);
  } else {
    console.error(`❌ Refund validation failed for ${paymentIntentId} - ${validation.error}: ${validation.details}`);
  }
}