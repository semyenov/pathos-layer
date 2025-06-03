import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/utils/schema/tables',
  out: './server/utils/migrations',
  driver: 'pglite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './dev.db'
  }
})
