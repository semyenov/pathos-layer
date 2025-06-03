import { drizzle } from 'drizzle-orm/pglite';

// Create a Postgres connection pool
const connectionString: string = process.env.DATABASE_URL || './dev.db';

// Create a Drizzle ORM instance
const db = drizzle(connectionString, {
  schema: tables,
  relations: relations,
  casing: 'camelCase',
  logger: true,
});

export type DB = typeof db;
export const useDb = (): DB => db

export type DrizzleRelations = typeof relations;
export type DrizzleTables = typeof tables;