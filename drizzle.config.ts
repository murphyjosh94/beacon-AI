import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: ".env.local",
});

const databaseUrl =
  process.env.DATABASE_MIGRATION_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL or DATABASE_URL is missing from .env.local."
  );
}

export default defineConfig({
  dialect: "postgresql",

  schema: "./src/lib/database/schema.ts",

  out: "./drizzle",

  dbCredentials: {
    url: databaseUrl,
  },

  strict: true,
  verbose: true,
});