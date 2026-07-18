import "server-only";

import {
  neonConfig,
  Pool,
} from "@neondatabase/serverless";

import { drizzle } from "drizzle-orm/neon-serverless";

import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not configured."
  );
}

/*
 * Beacon uses interactive database transactions for credit
 * reservations, refunds and other multi-step operations.
 *
 * The Neon HTTP driver does not support Drizzle's
 * database.transaction(callback) API, so Beacon must use
 * Neon's WebSocket-compatible Pool driver instead.
 */
neonConfig.webSocketConstructor =
  ws;

const pool =
  new Pool({
    connectionString:
      process.env.DATABASE_URL,
  });

export const database =
  drizzle({
    client:
      pool,
  });