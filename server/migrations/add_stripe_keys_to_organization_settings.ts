import { db } from "@db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

export async function addStripeKeysToOrganizationSettings() {
  try {
    log("Adding Stripe key columns to organization_settings table...");

    // Check if the columns already exist
    const columnsExist = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'organization_settings' AND column_name = 'stripe_secret_key'
    `);

    if (columnsExist.length === 0) {
      await db.execute(sql`
        ALTER TABLE organization_settings
        ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
        ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
        ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT,
        ADD COLUMN IF NOT EXISTS stripe_test_mode BOOLEAN DEFAULT true
      `);
      log("Stripe key columns added successfully");
    } else {
      log("Stripe key columns already exist");
    }
  } catch (error) {
    console.error("Error adding Stripe key columns:", error);
    throw error;
  }
}
