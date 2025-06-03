ALTER TABLE "accounts" DROP CONSTRAINT "accounts_accountId_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "image" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "accountId";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_unique" UNIQUE("token");