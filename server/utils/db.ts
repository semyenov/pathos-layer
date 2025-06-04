import { drizzle } from 'drizzle-orm/pglite';

import {
  relations as relationsSchema,
  tables as tablesSchema,
} from '../drizzle/schema';

// Create a Postgres connection pool
const connectionString: string = process.env.DATABASE_URL || './dev.db';

// Create a Drizzle ORM instance
const db = drizzle(connectionString, {
  schema: tablesSchema,
  relations: relationsSchema,
  casing: 'snake_case',
  logger: false,
});

export type DB = typeof db;
export const useDb = (): DB => db

export type DrizzleRelations = typeof relationsSchema;
export type DrizzleTables = typeof tablesSchema;

export const relations = relationsSchema;
export const tables = tablesSchema;