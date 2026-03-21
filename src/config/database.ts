import { Pool } from 'pg';
import { config } from './env';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

import { QueryResultRow } from 'pg';

export const query = <T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);
