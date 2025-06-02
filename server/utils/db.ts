import { drizzle } from 'drizzle-orm/pglite';
import { relations, tables } from './schema';

// Create a Postgres connection pool
const connectionString: string = process.env.DATABASE_URL || './dev.db';

// Create a Drizzle ORM instance
const db = drizzle(connectionString, {
  casing: 'camelCase',
  schema: tables,
  logger: true,
  relations,
});

export type DB = typeof db;
export const useDb = (): DB => db

export type DrizzleRelations = typeof relations;
export type DrizzleTables = typeof tables;