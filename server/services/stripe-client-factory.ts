/**
 * Per-tenant Stripe client factory.
 *
 * Resolution order:
 *   1. Organization's encrypted key from database → decrypt → create client
 *   2. process.env.STRIPE_SECRET_KEY (platform-level fallback)
 *   3. null (Stripe features disabled)
 *
 * Clients are cached in memory for 5 minutes to avoid repeated DB lookups
 * and decryption on every request.
 */
import Stripe from 'stripe';
import { db } from '../../db';
import { organizationSettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, maskApiKey } from './encryption';

const STRIPE_API_VERSION = '2024-06-20' as any;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedClient {
  client: Stripe;
  expiresAt: number;
}

const clientCache = new Map<string, CachedClient>();

// Fallback client from env var (created once)
let envClient: Stripe | null | undefined; // undefined = not yet initialized

function getEnvClient(): Stripe | null {
  if (envClient === undefined) {
    envClient = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
      : null;
  }
  return envClient;
}

/**
 * Get a Stripe client for the given organization.
 *
 * @param orgId - Organization settings ID. If omitted, uses env var fallback only.
 * @returns A Stripe client, or null if no key is configured anywhere.
 */
export async function getStripeClient(orgId?: number): Promise<Stripe | null> {
  // If no orgId provided, use env var directly
  if (!orgId) {
    return getEnvClient();
  }

  const cacheKey = `stripe-org-${orgId}`;

  // Check cache first
  const cached = clientCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.client;
  }

  // Look up org's encrypted key from database
  try {
    const [org] = await db
      .select({ stripeSecretKey: organizationSettings.stripeSecretKey })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, orgId))
      .limit(1);

    if (org?.stripeSecretKey) {
      const apiKey = decrypt(org.stripeSecretKey);
      const client = new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION });

      // Cache the client
      clientCache.set(cacheKey, {
        client,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return client;
    }
  } catch (error) {
    console.error(`[Stripe Factory] Failed to load key for org ${orgId}:`, error);
  }

  // Fall back to env var
  return getEnvClient();
}

/**
 * Get the Stripe webhook secret for the given organization.
 */
export async function getStripeWebhookSecret(orgId?: number): Promise<string | null> {
  if (orgId) {
    try {
      const [org] = await db
        .select({ stripeWebhookSecret: organizationSettings.stripeWebhookSecret })
        .from(organizationSettings)
        .where(eq(organizationSettings.id, orgId))
        .limit(1);

      if (org?.stripeWebhookSecret) {
        return decrypt(org.stripeWebhookSecret);
      }
    } catch (error) {
      console.error(`[Stripe Factory] Failed to load webhook secret for org ${orgId}:`, error);
    }
  }

  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

/**
 * Get the Stripe publishable key for the given organization.
 */
export async function getStripePublishableKey(orgId?: number): Promise<string | null> {
  if (orgId) {
    try {
      const [org] = await db
        .select({ stripePublishableKey: organizationSettings.stripePublishableKey })
        .from(organizationSettings)
        .where(eq(organizationSettings.id, orgId))
        .limit(1);

      if (org?.stripePublishableKey) {
        return decrypt(org.stripePublishableKey);
      }
    } catch (error) {
      console.error(`[Stripe Factory] Failed to load publishable key for org ${orgId}:`, error);
    }
  }

  return process.env.VITE_STRIPE_PUBLIC_KEY || process.env.STRIPE_PUBLISHABLE_KEY || null;
}

/**
 * Check whether Stripe is configured for an organization.
 * Returns status info without exposing actual keys.
 */
export async function getStripeStatus(orgId?: number): Promise<{
  configured: boolean;
  source: 'organization' | 'platform' | 'none';
  secretKeyPreview: string | null;
  publishableKeyPreview: string | null;
  webhookConfigured: boolean;
  testMode: boolean | null;
}> {
  // Check org keys first
  if (orgId) {
    try {
      const [org] = await db
        .select({
          stripeSecretKey: organizationSettings.stripeSecretKey,
          stripePublishableKey: organizationSettings.stripePublishableKey,
          stripeWebhookSecret: organizationSettings.stripeWebhookSecret,
          stripeTestMode: organizationSettings.stripeTestMode,
        })
        .from(organizationSettings)
        .where(eq(organizationSettings.id, orgId))
        .limit(1);

      if (org?.stripeSecretKey) {
        const secretKey = decrypt(org.stripeSecretKey);
        const publishableKey = org.stripePublishableKey ? decrypt(org.stripePublishableKey) : null;
        return {
          configured: true,
          source: 'organization',
          secretKeyPreview: maskApiKey(secretKey),
          publishableKeyPreview: publishableKey ? maskApiKey(publishableKey) : null,
          webhookConfigured: !!org.stripeWebhookSecret,
          testMode: org.stripeTestMode,
        };
      }
    } catch (error) {
      console.error(`[Stripe Factory] Failed to check status for org ${orgId}:`, error);
    }
  }

  // Check env var fallback
  if (process.env.STRIPE_SECRET_KEY) {
    return {
      configured: true,
      source: 'platform',
      secretKeyPreview: maskApiKey(process.env.STRIPE_SECRET_KEY),
      publishableKeyPreview: process.env.VITE_STRIPE_PUBLIC_KEY
        ? maskApiKey(process.env.VITE_STRIPE_PUBLIC_KEY)
        : process.env.STRIPE_PUBLISHABLE_KEY
          ? maskApiKey(process.env.STRIPE_PUBLISHABLE_KEY)
          : null,
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      testMode: process.env.STRIPE_SECRET_KEY.startsWith('sk_test_'),
    };
  }

  return {
    configured: false,
    source: 'none',
    secretKeyPreview: null,
    publishableKeyPreview: null,
    webhookConfigured: false,
    testMode: null,
  };
}

/**
 * Clear the cached client for an organization.
 * Call this after saving or removing Stripe keys.
 */
export function clearStripeClientCache(orgId: number): void {
  clientCache.delete(`stripe-org-${orgId}`);
}
