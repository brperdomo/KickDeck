import Stripe from 'stripe';
import { getStripeClient } from './stripe-client-factory';

// ─── Local caches to handle Stripe's eventual consistency on customer search ──
// When a customer is created, Stripe's `customers.list` may not find it for
// 1–3 seconds. If two calls arrive in that window they'd both create.
// These caches remember recent creates so the second call finds the first.

/** Platform customer cache: email → { customerId, createdAt } */
const platformCustomerCache = new Map<string, { customerId: string; createdAt: number }>();

/** Connected account customer cache: "acct_xxx:email" → { customerId, createdAt } */
const connectedCustomerCache = new Map<string, { customerId: string; createdAt: number }>();

/** Cache TTL — 60 seconds is plenty for Stripe to finish indexing */
const CACHE_TTL_MS = 60_000;

/** Clean stale entries periodically (every 5 minutes) */
function pruneCache(cache: Map<string, { customerId: string; createdAt: number }>) {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.createdAt > CACHE_TTL_MS) cache.delete(key);
  }
}
setInterval(() => {
  pruneCache(platformCustomerCache);
  pruneCache(connectedCustomerCache);
}, 5 * 60_000);

// ─── In-flight deduplication ──────────────────────────────────────────────────
// If two calls come in for the exact same email at the same instant, the second
// one should wait for the first to finish rather than racing.

const platformInflight = new Map<string, Promise<{ customerId: string; created: boolean }>>();
const connectedInflight = new Map<string, Promise<{ customerId: string; created: boolean }>>();

// ─── Connected account helper ─────────────────────────────────────────────────

/**
 * Find or create a customer on a Stripe Connected Account.
 *
 * If a customer with the given email already exists on the connected account,
 * we UPDATE their metadata to append the new team info (so a person who
 * registers multiple teams keeps a single customer record with all teams listed).
 *
 * If no customer exists, we CREATE one.
 *
 * This is always fire-and-forget / best-effort — the payment has already succeeded.
 */
export async function findOrCreateConnectedCustomer(opts: {
  connectAccountId: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}): Promise<{ customerId: string; created: boolean }> {
  const key = `${opts.connectAccountId}:${opts.email.toLowerCase()}`;

  // If there's already an in-flight call for this exact key, piggyback on it
  const inflight = connectedInflight.get(key);
  if (inflight) {
    console.log(`⏳ Waiting on in-flight connected customer lookup for ${key}`);
    const result = await inflight;
    // The in-flight call already created/found the customer. Update metadata for THIS team.
    return _updateExistingConnectedCustomer(opts, result.customerId);
  }

  const promise = _findOrCreateConnectedCustomerImpl(opts);
  connectedInflight.set(key, promise);
  try {
    return await promise;
  } finally {
    connectedInflight.delete(key);
  }
}

async function _updateExistingConnectedCustomer(
  opts: { connectAccountId: string; email: string; name: string; metadata: Record<string, string> },
  customerId: string,
): Promise<{ customerId: string; created: boolean }> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const { connectAccountId, name, metadata } = opts;

  try {
    const customer = await stripe.customers.retrieve(customerId, { stripeAccount: connectAccountId });
    if ((customer as any).deleted) throw new Error('Customer was deleted');

    const prevTeams = (customer as Stripe.Customer).metadata?.registeredTeams || '';
    const newTeamEntry = `${metadata.teamName || 'Team'}(#${metadata.teamId})`;
    const registeredTeams = prevTeams
      ? (prevTeams.includes(newTeamEntry) ? prevTeams : `${prevTeams}, ${newTeamEntry}`)
      : newTeamEntry;

    await stripe.customers.update(
      customerId,
      { name, metadata: { ...(customer as Stripe.Customer).metadata, ...metadata, registeredTeams, lastPaymentDate: new Date().toISOString() } },
      { stripeAccount: connectAccountId },
    );
  } catch {
    // Best-effort — customer might have been deleted between calls
  }

  return { customerId, created: false };
}

async function _findOrCreateConnectedCustomerImpl(opts: {
  connectAccountId: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}): Promise<{ customerId: string; created: boolean }> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const { connectAccountId, email, name, metadata } = opts;
  const cacheKey = `${connectAccountId}:${email.toLowerCase()}`;

  // 1. Check local cache first (handles Stripe eventual consistency)
  const cached = connectedCustomerCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    console.log(`🔄 Using cached connected customer ${cached.customerId} for ${email} on ${connectAccountId}`);
    return _updateExistingConnectedCustomer(opts, cached.customerId);
  }

  // 2. Search Stripe
  const existing = await stripe.customers.list(
    { email: email.toLowerCase(), limit: 1 },
    { stripeAccount: connectAccountId },
  );

  if (existing.data.length > 0) {
    const customer = existing.data[0];

    // Build merged metadata: preserve existing teams, append new one
    const prevTeams = customer.metadata?.registeredTeams || '';
    const newTeamEntry = `${metadata.teamName || 'Team'}(#${metadata.teamId})`;
    const registeredTeams = prevTeams
      ? (prevTeams.includes(newTeamEntry) ? prevTeams : `${prevTeams}, ${newTeamEntry}`)
      : newTeamEntry;

    await stripe.customers.update(
      customer.id,
      {
        name,
        metadata: {
          ...customer.metadata,
          ...metadata,
          registeredTeams,
          lastPaymentDate: new Date().toISOString(),
        },
      },
      { stripeAccount: connectAccountId },
    );

    // Cache for future lookups
    connectedCustomerCache.set(cacheKey, { customerId: customer.id, createdAt: Date.now() });

    console.log(`✅ Updated existing customer ${customer.id} on connected account ${connectAccountId} (returning customer for team ${metadata.teamId})`);
    return { customerId: customer.id, created: false };
  }

  // 3. No existing customer — create one
  const newCustomer = await stripe.customers.create(
    {
      email: email.toLowerCase(),
      name,
      metadata: {
        ...metadata,
        registeredTeams: `${metadata.teamName || 'Team'}(#${metadata.teamId})`,
        lastPaymentDate: new Date().toISOString(),
      },
    },
    { stripeAccount: connectAccountId },
  );

  // Cache the new customer
  connectedCustomerCache.set(cacheKey, { customerId: newCustomer.id, createdAt: Date.now() });

  console.log(`✅ Created new customer ${newCustomer.id} on connected account ${connectAccountId} for team ${metadata.teamId}`);
  return { customerId: newCustomer.id, created: true };
}

// ─── Platform account helper ──────────────────────────────────────────────────

/**
 * Find or create a customer on the KickDeck PLATFORM Stripe account.
 *
 * Mirrors the connected-account version above but operates on the platform
 * (no stripeAccount header). Destination charges require customers to live
 * on the platform account, so this is used by every payment flow.
 *
 * If a customer with the given email already exists, we UPDATE their metadata
 * to append the new team info (so a person who registers multiple teams keeps
 * a single customer record with all teams listed).
 *
 * If no customer exists, we CREATE one.
 *
 * Includes local caching and in-flight deduplication to handle Stripe's
 * eventual consistency on `customers.list` (avoids duplicate customers when
 * two calls for the same email arrive within ~1-3 seconds of each other).
 */
export async function findOrCreatePlatformCustomer(opts: {
  email: string;
  name: string;
  description?: string;
  metadata: Record<string, string>;
}): Promise<{ customerId: string; created: boolean }> {
  const key = opts.email.toLowerCase();

  // If there's already an in-flight call for this exact email, piggyback on it
  const inflight = platformInflight.get(key);
  if (inflight) {
    console.log(`⏳ Waiting on in-flight platform customer lookup for ${key}`);
    const result = await inflight;
    // The in-flight call already created/found the customer. Update metadata for THIS team.
    return _updateExistingPlatformCustomer(opts, result.customerId);
  }

  const promise = _findOrCreatePlatformCustomerImpl(opts);
  platformInflight.set(key, promise);
  try {
    return await promise;
  } finally {
    platformInflight.delete(key);
  }
}

async function _updateExistingPlatformCustomer(
  opts: { email: string; name: string; description?: string; metadata: Record<string, string> },
  customerId: string,
): Promise<{ customerId: string; created: boolean }> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const { name, description, metadata } = opts;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ((customer as any).deleted) throw new Error('Customer was deleted');

    const prevTeams = (customer as Stripe.Customer).metadata?.registeredTeams || '';
    const newTeamEntry = `${metadata.teamName || 'Team'}(#${metadata.teamId})`;
    const registeredTeams = prevTeams
      ? (prevTeams.includes(newTeamEntry) ? prevTeams : `${prevTeams}, ${newTeamEntry}`)
      : newTeamEntry;

    await stripe.customers.update(customerId, {
      name,
      ...(description ? { description } : {}),
      metadata: { ...(customer as Stripe.Customer).metadata, ...metadata, registeredTeams, lastPaymentDate: new Date().toISOString() },
    });
  } catch {
    // Best-effort — customer might have been deleted between calls
  }

  return { customerId, created: false };
}

async function _findOrCreatePlatformCustomerImpl(opts: {
  email: string;
  name: string;
  description?: string;
  metadata: Record<string, string>;
}): Promise<{ customerId: string; created: boolean }> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  const { email, name, description, metadata } = opts;
  const cacheKey = email.toLowerCase();

  // 1. Check local cache first (handles Stripe eventual consistency)
  const cached = platformCustomerCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    console.log(`🔄 Using cached platform customer ${cached.customerId} for ${email}`);
    return _updateExistingPlatformCustomer(opts, cached.customerId);
  }

  // 2. Search Stripe
  const existing = await stripe.customers.list({
    email: email.toLowerCase(),
    limit: 1,
  });

  if (existing.data.length > 0) {
    const customer = existing.data[0];

    // Build merged metadata: preserve existing teams, append new one
    const prevTeams = customer.metadata?.registeredTeams || '';
    const newTeamEntry = `${metadata.teamName || 'Team'}(#${metadata.teamId})`;
    const registeredTeams = prevTeams
      ? (prevTeams.includes(newTeamEntry) ? prevTeams : `${prevTeams}, ${newTeamEntry}`)
      : newTeamEntry;

    await stripe.customers.update(customer.id, {
      name,
      ...(description ? { description } : {}),
      metadata: {
        ...customer.metadata,
        ...metadata,
        registeredTeams,
        lastPaymentDate: new Date().toISOString(),
      },
    });

    // Cache for future lookups
    platformCustomerCache.set(cacheKey, { customerId: customer.id, createdAt: Date.now() });

    console.log(`✅ Reusing existing platform customer ${customer.id} for team ${metadata.teamId} (${registeredTeams})`);
    return { customerId: customer.id, created: false };
  }

  // 3. No existing customer — create one
  const newCustomer = await stripe.customers.create({
    email: email.toLowerCase(),
    name,
    ...(description ? { description } : {}),
    metadata: {
      ...metadata,
      registeredTeams: `${metadata.teamName || 'Team'}(#${metadata.teamId})`,
      lastPaymentDate: new Date().toISOString(),
    },
  });

  // Cache the new customer
  platformCustomerCache.set(cacheKey, { customerId: newCustomer.id, createdAt: Date.now() });

  console.log(`✅ Created new platform customer ${newCustomer.id} for team ${metadata.teamId}`);
  return { customerId: newCustomer.id, created: true };
}
