/**
 * STRIPE CUSTOMER CLEANUP SERVICE
 *
 * One-time utility to deduplicate Stripe customers that were created before
 * the find-or-create pattern was introduced.
 *
 * Handles BOTH sides:
 *   1. Platform account — where payment intents & charges live
 *   2. Connected accounts — where tournament organizers see their dashboard
 *
 * For each side, it:
 *   - Lists all customers
 *   - Groups them by email
 *   - For emails with multiple customers: keeps the oldest, merges metadata, deletes the rest
 *   - Updates DB references (teams.stripeCustomerId) to point to the keeper
 *
 * Supports DRY RUN mode (default) — reports what it *would* do without touching anything.
 */

import Stripe from 'stripe';
import { getStripeClient } from './stripe-client-factory';
import { db } from '../../db/index.js';
import { teams, events } from '../../db/schema.js';
import { eq, isNotNull, sql } from 'drizzle-orm';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DuplicateGroup {
  email: string;
  customers: Array<{
    id: string;
    email: string | null;
    name: string | null;
    created: number;
    metadata: Record<string, string>;
    hasPaymentMethods: boolean;
  }>;
  keeperId: string;
  deleteIds: string[];
  mergedRegisteredTeams: string;
}

export interface CleanupResult {
  scope: 'platform' | string; // 'platform' or 'acct_xxx'
  totalCustomers: number;
  uniqueEmails: number;
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  deleted: number;
  dbRefsUpdated: number;
  errors: string[];
  dryRun: boolean;
}

export interface FullCleanupResult {
  platform: CleanupResult;
  connectedAccounts: CleanupResult[];
  summary: {
    totalDuplicatesFound: number;
    totalDeleted: number;
    totalDbRefsUpdated: number;
    dryRun: boolean;
  };
}

// ─── Core dedup logic (works for both platform and connected accounts) ──────

async function listAllCustomers(
  stripe: Stripe,
  stripeAccountId?: string,
): Promise<Stripe.Customer[]> {
  const customers: Stripe.Customer[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.CustomerListParams = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const page = stripeAccountId
      ? await stripe.customers.list(params, { stripeAccount: stripeAccountId })
      : await stripe.customers.list(params);

    for (const customer of page.data) {
      if ((customer as any).deleted) continue;
      customers.push(customer);
    }

    hasMore = page.has_more;
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id;
    }
  }

  return customers;
}

function groupByEmail(customers: Stripe.Customer[]): Map<string, Stripe.Customer[]> {
  const groups = new Map<string, Stripe.Customer[]>();

  for (const cust of customers) {
    if (!cust.email) continue; // Can't deduplicate without an email
    const key = cust.email.toLowerCase();
    const existing = groups.get(key) || [];
    existing.push(cust);
    groups.set(key, existing);
  }

  return groups;
}

function buildMergedRegisteredTeams(customers: Stripe.Customer[]): string {
  const allTeams = new Set<string>();

  for (const cust of customers) {
    const rt = cust.metadata?.registeredTeams || '';
    if (rt) {
      // Split by comma, trim, add each entry
      rt.split(',').map(t => t.trim()).filter(Boolean).forEach(t => allTeams.add(t));
    }

    // Also try to build an entry from individual metadata if registeredTeams is missing
    const teamId = cust.metadata?.teamId;
    const teamName = cust.metadata?.teamName;
    if (teamId) {
      const entry = `${teamName || 'Team'}(#${teamId})`;
      allTeams.add(entry);
    }
  }

  return Array.from(allTeams).join(', ');
}

async function checkHasPaymentMethods(
  stripe: Stripe,
  customerId: string,
  stripeAccountId?: string,
): Promise<boolean> {
  try {
    const params: Stripe.PaymentMethodListParams = { customer: customerId, limit: 1 };
    const pms = stripeAccountId
      ? await stripe.paymentMethods.list(params, { stripeAccount: stripeAccountId })
      : await stripe.paymentMethods.list(params);
    return pms.data.length > 0;
  } catch {
    return false;
  }
}

async function deduplicateCustomers(
  stripe: Stripe,
  scope: string,
  stripeAccountId?: string,
  dryRun = true,
): Promise<CleanupResult> {
  const result: CleanupResult = {
    scope,
    totalCustomers: 0,
    uniqueEmails: 0,
    duplicateGroups: [],
    totalDuplicates: 0,
    deleted: 0,
    dbRefsUpdated: 0,
    errors: [],
    dryRun,
  };

  const opts: Stripe.RequestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : {};

  console.log(`🔍 [${scope}] Listing all customers...`);
  const allCustomers = await listAllCustomers(stripe, stripeAccountId);
  result.totalCustomers = allCustomers.length;

  console.log(`📊 [${scope}] Found ${allCustomers.length} total customers`);

  const groups = groupByEmail(allCustomers);
  result.uniqueEmails = groups.size;

  // Find groups with duplicates (more than 1 customer per email)
  for (const [email, customers] of groups) {
    if (customers.length <= 1) continue;

    // Sort by creation date (oldest first) — keep the oldest
    customers.sort((a, b) => a.created - b.created);

    // Check which have payment methods (prefer keeping those)
    const withPmChecks = await Promise.all(
      customers.map(async (c) => ({
        ...c,
        _hasPm: await checkHasPaymentMethods(stripe, c.id, stripeAccountId),
      })),
    );

    // Prefer keeper: one with payment methods + oldest. If multiple have PMs, pick oldest with PM.
    const withPms = withPmChecks.filter(c => c._hasPm);
    const keeper = withPms.length > 0 ? withPms[0] : withPmChecks[0];
    const toDelete = withPmChecks.filter(c => c.id !== keeper.id);

    const mergedRegisteredTeams = buildMergedRegisteredTeams(customers);

    const group: DuplicateGroup = {
      email,
      customers: withPmChecks.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        created: c.created,
        metadata: c.metadata || {},
        hasPaymentMethods: c._hasPm,
      })),
      keeperId: keeper.id,
      deleteIds: toDelete.map(c => c.id),
      mergedRegisteredTeams,
    };

    result.duplicateGroups.push(group);
    result.totalDuplicates += toDelete.length;

    if (!dryRun) {
      // 1. Update keeper with merged metadata
      try {
        const updateParams: Stripe.CustomerUpdateParams = {
          metadata: {
            ...keeper.metadata,
            registeredTeams: mergedRegisteredTeams,
            deduplicatedAt: new Date().toISOString(),
            mergedFrom: toDelete.map(c => c.id).join(', '),
          },
        };
        if (stripeAccountId) {
          await stripe.customers.update(keeper.id, updateParams, { stripeAccount: stripeAccountId });
        } else {
          await stripe.customers.update(keeper.id, updateParams);
        }
        console.log(`  ✅ [${scope}] Updated keeper ${keeper.id} with merged metadata`);
      } catch (err: any) {
        result.errors.push(`Update keeper ${keeper.id}: ${err.message}`);
      }

      // 2. Update DB references (only for platform customers)
      if (!stripeAccountId) {
        for (const dup of toDelete) {
          try {
            await db
              .update(teams)
              .set({ stripeCustomerId: keeper.id })
              .where(eq(teams.stripeCustomerId, dup.id));
            result.dbRefsUpdated++;
            console.log(`  ✅ [${scope}] Updated DB refs from ${dup.id} → ${keeper.id}`);
          } catch (dbErr: any) {
            result.errors.push(`DB update ${dup.id}: ${dbErr.message}`);
          }
        }
      }

      // 3. Delete duplicates
      for (const dup of toDelete) {
        try {
          if (stripeAccountId) {
            await stripe.customers.del(dup.id, { stripeAccount: stripeAccountId });
          } else {
            await stripe.customers.del(dup.id);
          }
          result.deleted++;
          console.log(`  🗑️ [${scope}] Deleted duplicate customer ${dup.id} (${email})`);
        } catch (delErr: any) {
          // If customer has active subscriptions or invoices, we can't delete
          result.errors.push(`Delete ${dup.id}: ${delErr.message}`);
          console.warn(`  ⚠️ [${scope}] Could not delete ${dup.id}: ${delErr.message}`);
        }
      }

      // Rate limiting between groups
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(
    `📈 [${scope}] ${dryRun ? 'DRY RUN' : 'EXECUTED'}: ` +
    `${result.totalCustomers} customers, ${result.uniqueEmails} unique emails, ` +
    `${result.duplicateGroups.length} duplicate groups (${result.totalDuplicates} to remove)`,
  );

  return result;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Deduplicate customers on the PLATFORM account.
 * @param dryRun If true (default), only reports what would be done.
 */
export async function deduplicatePlatformCustomers(dryRun = true): Promise<CleanupResult> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  console.log(`🚀 PLATFORM CUSTOMER CLEANUP: ${dryRun ? 'DRY RUN' : 'EXECUTING'}...`);
  return deduplicateCustomers(stripe, 'platform', undefined, dryRun);
}

/**
 * Deduplicate customers on a specific CONNECTED account.
 * @param connectAccountId The acct_xxx ID
 * @param dryRun If true (default), only reports what would be done.
 */
export async function deduplicateConnectedCustomers(
  connectAccountId: string,
  dryRun = true,
): Promise<CleanupResult> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  console.log(`🚀 CONNECTED ACCOUNT CLEANUP (${connectAccountId}): ${dryRun ? 'DRY RUN' : 'EXECUTING'}...`);
  return deduplicateCustomers(stripe, connectAccountId, connectAccountId, dryRun);
}

/**
 * Deduplicate customers on the platform AND all connected accounts.
 * @param dryRun If true (default), only reports what would be done.
 */
export async function deduplicateAllCustomers(dryRun = true): Promise<FullCleanupResult> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  console.log(`🚀 FULL CUSTOMER CLEANUP: ${dryRun ? 'DRY RUN' : 'EXECUTING'}...`);

  // 1. Platform account
  const platform = await deduplicateCustomers(stripe, 'platform', undefined, dryRun);

  // 2. All connected accounts (get unique Connect account IDs from events table)
  const connectAccounts = await db
    .selectDistinct({ connectAccountId: events.stripeConnectAccountId })
    .from(events)
    .where(isNotNull(events.stripeConnectAccountId));

  const connectedResults: CleanupResult[] = [];
  for (const row of connectAccounts) {
    if (!row.connectAccountId) continue;
    try {
      const result = await deduplicateCustomers(
        stripe,
        row.connectAccountId,
        row.connectAccountId,
        dryRun,
      );
      connectedResults.push(result);

      // Rate limiting between accounts
      await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.warn(`⚠️ Could not process connected account ${row.connectAccountId}: ${err.message}`);
      connectedResults.push({
        scope: row.connectAccountId,
        totalCustomers: 0,
        uniqueEmails: 0,
        duplicateGroups: [],
        totalDuplicates: 0,
        deleted: 0,
        dbRefsUpdated: 0,
        errors: [err.message],
        dryRun,
      });
    }
  }

  const totalDuplicatesFound = platform.totalDuplicates +
    connectedResults.reduce((sum, r) => sum + r.totalDuplicates, 0);
  const totalDeleted = platform.deleted +
    connectedResults.reduce((sum, r) => sum + r.deleted, 0);
  const totalDbRefsUpdated = platform.dbRefsUpdated +
    connectedResults.reduce((sum, r) => sum + r.dbRefsUpdated, 0);

  console.log(`\n🎉 FULL CUSTOMER CLEANUP ${dryRun ? '(DRY RUN)' : ''} COMPLETE:`);
  console.log(`   Platform: ${platform.totalDuplicates} duplicates`);
  console.log(`   Connected accounts: ${connectedResults.length} accounts processed`);
  console.log(`   Total duplicates: ${totalDuplicatesFound}`);
  if (!dryRun) {
    console.log(`   Deleted: ${totalDeleted}`);
    console.log(`   DB refs updated: ${totalDbRefsUpdated}`);
  }

  return {
    platform,
    connectedAccounts: connectedResults,
    summary: {
      totalDuplicatesFound,
      totalDeleted,
      totalDbRefsUpdated,
      dryRun,
    },
  };
}
