import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For hosted databases that require TLS, configure SSL via deployment environment.
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});
