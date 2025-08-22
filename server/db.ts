import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, vehicles, fuelRequisitions, suppliers, companies } from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Clean up the DATABASE_URL in case it contains extra environment variables
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl.includes('DATABASE_URL=')) {
  // Extract the actual database URL from the concatenated string
  const match = databaseUrl.match(/DATABASE_URL=([^\s]+)/);
  if (match) {
    databaseUrl = match[1];
  }
}

// Create the connection
const sql = neon(databaseUrl);
export const db = drizzle(sql, {
  schema: {
    users,
    vehicles,
    fuelRequisitions,
    suppliers,
    companies,
  },
});

export type Database = typeof db;