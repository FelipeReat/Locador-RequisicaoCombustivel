import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import * as pg from 'pg';
import { users, vehicles, fuelRequisitions, suppliers, companies, fuelRecords, vehicleChecklists } from '@shared/schema';

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

const isNeon = /neon\.tech/.test(databaseUrl) || /neondb_owner/.test(databaseUrl);
const needsSSL = isNeon || /sslmode=require/.test(databaseUrl) || /ssl=true/.test(databaseUrl);

let db: any;
if (isNeon) {
  const sql = neon(databaseUrl);
  db = drizzleNeon(sql, {
    schema: {
      users,
      vehicles,
      fuelRequisitions,
      suppliers,
      companies,
      fuelRecords,
      vehicleChecklists,
    },
  });
} else {
  const client = new pg.Client({ connectionString: databaseUrl, ssl: needsSSL ? { rejectUnauthorized: false } : false });
  await client.connect();
  db = drizzlePg(client, {
    schema: {
      users,
      vehicles,
      fuelRequisitions,
      suppliers,
      companies,
      fuelRecords,
      vehicleChecklists,
    },
  });
}

export { db };

export type Database = typeof db;
