import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, vehicles, fuelRequisitions, suppliers, companies } from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection
const sql = neon(process.env.DATABASE_URL);
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