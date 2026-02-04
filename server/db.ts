import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import pg from 'pg';
import * as schema from '@shared/schema';

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

const url = new URL(databaseUrl);
const isNeon = /neon\.tech/.test(databaseUrl) || /neondb_owner/.test(databaseUrl);
const isRDS = /rds\.amazonaws\.com/.test(databaseUrl);
const needsSSL = isNeon || isRDS || url.searchParams.get('ssl') === 'true' || url.searchParams.get('sslmode') === 'require';

// Remove SSL params from the connection string to avoid conflicts with the config object
url.searchParams.delete('ssl');
url.searchParams.delete('sslmode');
const connectionString = url.toString();

let db: any;
if (isNeon) {
  const sql = neon(databaseUrl);
  db = drizzleNeon(sql, { schema });
} else {
  console.log(`Initializing Postgres pool with SSL: ${needsSSL ? 'Enabled (Accept Self-Signed)' : 'Disabled'}`);
  const pool = new pg.Pool({ 
    connectionString, 
    ssl: needsSSL ? { rejectUnauthorized: false } : false,
    max: 20, // Set maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Add error handler to prevent crashing on unexpected connection issues
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit the process, just log the error. 
    // The pool will try to create new clients when needed.
  });

  db = drizzlePg(pool, { schema });
}

export { db };

export type Database = typeof db;
