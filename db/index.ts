import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create a PostgreSQL client
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/matchpro';
const client = postgres(connectionString);

// Create a drizzle client
export const db = drizzle(client, { schema });
