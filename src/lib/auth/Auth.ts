import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";

import { database } from "@/lib/database/Database";

import {
  account,
  session,
  user,
  verification,
} from "@/lib/database/schema";

function readRequiredEnvironmentVariable(
  name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is not configured.`
    );
  }

  return value;
}

const baseURL =
  readRequiredEnvironmentVariable(
    "BETTER_AUTH_URL"
  );

const secret =
  readRequiredEnvironmentVariable(
    "BETTER_AUTH_SECRET"
  );

export const auth = betterAuth({
  appName: "Beacon AI",

  baseURL,

  basePath: "/api/auth",

  secret,

  database: drizzleAdapter(
    database,
    {
      provider: "pg",

      schema: {
        user,
        session,
        account,
        verification,
      },
    }
  ),

  emailAndPassword: {
    enabled: true,

    minPasswordLength: 8,

    maxPasswordLength: 128,

    autoSignIn: true,
  },

  session: {
    expiresIn:
      60 * 60 * 24 * 30,

    updateAge:
      60 * 60 * 24,

    cookieCache: {
      enabled: true,

      maxAge:
        60 * 5,
    },
  },

  trustedOrigins: [
    "https://beacon-ai.co.uk",
    "https://www.beacon-ai.co.uk",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ],

  advanced: {
    cookiePrefix:
      "beacon_ai",

    useSecureCookies:
      process.env.NODE_ENV ===
      "production",
  },

  plugins: [
    nextCookies(),
  ],
});

export type BeaconAuth =
  typeof auth;