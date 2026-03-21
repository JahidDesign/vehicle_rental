import { Pool, QueryResultRow } from 'pg';
import { config } from './env';

export const pool = new Pool(
  config.db.url
    ? { connectionString: config.db.url }
    : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
    }
);

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
});

export const query = <T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);