import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Explicitly load .env.local to ensure variables are available
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Falls back to standard URL if UNPOOLED is missing
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
});