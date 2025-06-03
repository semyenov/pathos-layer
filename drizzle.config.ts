import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/drizzle/schema/tables/*.ts',
  out: './server/drizzle/migrations',
  driver: 'pglite',
  strict: true,
  dbCredentials: {
    url: process.env.DATABASE_URL || './dev.db'
  }
})
