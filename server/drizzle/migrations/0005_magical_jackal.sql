ALTER TABLE "users" DROP CONSTRAINT "users_activeOrganizationId_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "activeOrganizationId";