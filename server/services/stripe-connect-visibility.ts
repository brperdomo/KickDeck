/**
 * STRIPE CONNECT VISIBILITY SERVICE
 *
 * Centralised helper that makes payments visible on connected accounts.
 *
 * With DESTINATION CHARGES the connected account's Stripe dashboard shows:
 *   - Transactions → a `py_xxx` charge (the "destination payment")
 *   - Transfers → an inbound transfer from the platform
 *   - Customers → only if we explicitly create them
 *
 * This module handles ALL three in one call so every payment path doesn't
 * have to duplicate the same logic.
 */

import Stripe from 'stripe';
import { getStripeClient } from './stripe-client-factory';
import { findOrCreateConnectedCustomer } from './stripe-connect-customer';

export interface ConnectVisibilityOpts {
  /** Connected account ID (acct_xxx) */
  connectAccountId: string;
  /** The platform payment intent ID */
  paymentIntentId: string;
  /** Team / event metadata to stamp on everything */
  metadata: Record<string, string>;
  /** Human-readable description for transfer + destination payment */
  description: string;
  /** Customer email for find-or-create on connected account (optional) */
  customerEmail?: string;
  /** Customer display name */
  customerName?: string;
}

export interface ConnectVisibilityResult {
  transferId: string | null;
  destinationPaymentId: string | null;
  connectedCustomerId: string | null;
  errors: string[];
}

/**
 * Update transfer metadata, destination payment metadata, and find-or-create
 * a customer on the connected account.
 *
 * Designed to run inside a setTimeout (3s delay) after a successful payment
 * to give Stripe time to finalise the transfer for automatic_async captures.
 */
export async function updateConnectVisibility(
  opts: ConnectVisibilityOpts,
): Promise<ConnectVisibilityResult> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const {
    connectAccountId,
    paymentIntentId,
    metadata,
    description,
    customerEmail,
    customerName,
  } = opts;

  const result: ConnectVisibilityResult = {
    transferId: null,
    destinationPaymentId: null,
    connectedCustomerId: null,
    errors: [],
  };

  // ── 1. Find the transfer ──────────────────────────────────────────
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const transferGroup = pi.transfer_group;
    const piCharge = pi.latest_charge as string | null;

    let transfer: Stripe.Transfer | null = null;

    // Primary: transfer_group lookup (most reliable for async captures)
    if (transferGroup) {
      const transfers = await stripe.transfers.list({
        transfer_group: transferGroup,
        limit: 1,
      });
      if (transfers.data.length > 0) transfer = transfers.data[0];
    }

    // Fallback: expand from charge
    if (!transfer && piCharge) {
      const charge = await stripe.charges.retrieve(piCharge, {
        expand: ['transfer'],
      });
      if (charge.transfer && typeof charge.transfer !== 'string') {
        transfer = charge.transfer as Stripe.Transfer;
      } else if (typeof charge.transfer === 'string') {
        transfer = await stripe.transfers.retrieve(charge.transfer);
      }
    }

    // ── 2. Update the transfer ────────────────────────────────────
    if (transfer) {
      result.transferId = transfer.id;

      await stripe.transfers.update(transfer.id, {
        description,
        metadata: {
          ...metadata,
          paymentIntentId,
        },
      });
      console.log(`  ✅ Updated transfer ${transfer.id} with metadata`);

      // ── 3. Update the destination payment on the connected account ──
      // transfer.destination_payment is the py_xxx charge the organiser sees
      const destPaymentId =
        typeof transfer.destination_payment === 'string'
          ? transfer.destination_payment
          : (transfer.destination_payment as any)?.id;

      if (destPaymentId) {
        result.destinationPaymentId = destPaymentId;
        try {
          await stripe.charges.update(
            destPaymentId,
            {
              description,
              metadata: {
                ...metadata,
                paymentIntentId,
                // Include customer info so organiser can identify who paid
                // (destination charges can't link a customer to the auto-created py_xxx)
                ...(customerEmail ? { customerEmail } : {}),
                ...(customerName ? { customerName } : {}),
              },
            },
            { stripeAccount: connectAccountId },
          );
          console.log(
            `  ✅ Updated destination payment ${destPaymentId} on connected account`,
          );
        } catch (destErr: any) {
          result.errors.push(`Destination payment: ${destErr.message}`);
          console.warn(
            `  ⚠️ Could not update destination payment ${destPaymentId}:`,
            destErr.message,
          );
        }
      } else {
        console.log(`  ⚠️ No destination_payment on transfer ${transfer.id}`);
      }
    } else {
      console.log(
        `  ⚠️ No transfer found for PI ${paymentIntentId} (transfer_group: ${pi.transfer_group})`,
      );
      result.errors.push(`No transfer found for PI ${paymentIntentId}`);
    }
  } catch (transferErr: any) {
    result.errors.push(`Transfer lookup: ${transferErr.message}`);
    console.warn(`  ⚠️ Transfer lookup failed:`, transferErr.message);
  }

  // ── 4. Find or create customer on connected account ─────────────
  if (customerEmail) {
    try {
      const { customerId } = await findOrCreateConnectedCustomer({
        connectAccountId,
        email: customerEmail,
        name: customerName || 'Team Manager',
        metadata,
      });
      result.connectedCustomerId = customerId;
    } catch (custErr: any) {
      result.errors.push(`Connected customer: ${custErr.message}`);
      console.warn(`  ⚠️ Connected customer failed:`, custErr.message);
    }
  }

  return result;
}

/**
 * Convenience wrapper that schedules updateConnectVisibility after a delay.
 * Used by payment flows where the transfer may not exist immediately
 * (automatic_async capture).
 *
 * Fire-and-forget — errors are logged, never thrown.
 */
export function scheduleConnectVisibilityUpdate(
  opts: ConnectVisibilityOpts,
  delayMs = 3000,
): void {
  setTimeout(async () => {
    try {
      console.log(
        `🔄 Updating Connect visibility for PI ${opts.paymentIntentId} (delayed ${delayMs}ms)...`,
      );
      const result = await updateConnectVisibility(opts);
      if (result.errors.length > 0) {
        console.warn(
          `  ⚠️ Connect visibility partial errors:`,
          result.errors,
        );
      } else {
        console.log(
          `  ✅ Connect visibility complete — transfer: ${result.transferId}, destPayment: ${result.destinationPaymentId}, customer: ${result.connectedCustomerId}`,
        );
      }
    } catch (err) {
      console.warn('Could not update Connect visibility (non-fatal):', err);
    }
  }, delayMs);
}
