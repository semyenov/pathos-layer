CREATE TYPE "public"."FileAccessLevel" AS ENUM('private', 'organization', 'public');--> statement-breakpoint
CREATE TYPE "public"."FieldStatus" AS ENUM('draft', 'rejected', 'approved');--> statement-breakpoint
CREATE TYPE "public"."FieldType" AS ENUM('text', 'textarea', 'number', 'date', 'select', 'checkbox', 'radio', 'file');--> statement-breakpoint
CREATE TYPE "public"."FormStatus" AS ENUM('draft', 'underReview', 'needsChanges', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."ReviewFlowStatus" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."organizationRoleEnum" AS ENUM('owner', 'reviewer', 'executor', 'member');--> statement-breakpoint
CREATE TYPE "public"."userRoleEnum" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"memberId" uuid NOT NULL,
	"formId" uuid NOT NULL,
	"formFieldId" uuid NOT NULL,
	"reviewFlowId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"name" text NOT NULL,
	"path" text,
	"version" integer DEFAULT 1 NOT NULL,
	"parentId" uuid,
	"organizationId" uuid NOT NULL,
	"creatorMemberId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"formFieldId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expiresAt" timestamp (3),
	"memberId" uuid NOT NULL,
	"formFieldId" uuid NOT NULL,
	"fileId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accessLevel" "FileAccessLevel" DEFAULT 'organization' NOT NULL,
	"accessedAt" timestamp (3),
	"deleted" boolean DEFAULT false NOT NULL,
	"description" text,
	"filename" text NOT NULL,
	"mimeType" text NOT NULL,
	"originalName" text,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"organizationId" uuid NOT NULL,
	"uploaderMemberId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"formFieldId" uuid NOT NULL,
	"fileFolderId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"options" text,
	"order" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"status" "FieldStatus" DEFAULT 'draft' NOT NULL,
	"type" "FieldType" DEFAULT 'text' NOT NULL,
	"validationRules" text,
	"description" text,
	"value" text,
	"formId" uuid NOT NULL,
	"templateFieldId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" text,
	"status" "FormStatus" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"formId" uuid NOT NULL,
	"memberId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "FormStatus" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"creatorMemberId" uuid NOT NULL,
	"executorMemberId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"templateId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "ReviewFlowStatus" DEFAULT 'open' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"formId" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_template_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"defaultValue" text,
	"name" text NOT NULL,
	"options" text,
	"order" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"type" "FieldType" NOT NULL,
	"validationRules" text,
	"value" text,
	"description" text,
	"templateId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"creatorMemberId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "form_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text,
	"accessToken" text,
	"idToken" text,
	"password" text,
	"providerId" text NOT NULL,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp (3),
	"refreshTokenExpiresAt" timestamp (3),
	"accountId" text NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_accountId_unique" UNIQUE("accountId")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "organizationRoleEnum" DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expiresAt" timestamp (3) DEFAULT now() NOT NULL,
	"token" text NOT NULL,
	"inviterId" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "organizationRoleEnum" DEFAULT 'member' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"userId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"organizationId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"logo" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"metadata" text,
	"ownerId" uuid NOT NULL,
	"lastModifiedBy" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"ipAddress" text,
	"token" text NOT NULL,
	"userAgent" text,
	"impersonatedBy" uuid,
	"userId" uuid NOT NULL,
	"activeOrganizationId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "userRoleEnum" DEFAULT 'user' NOT NULL,
	"banned" boolean,
	"banExpires" timestamp (3),
	"banReason" text,
	"activeOrganizationId" uuid NOT NULL,
	"impersonatedBy" uuid,
	"lastModifiedBy" uuid,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp (3) DEFAULT now() NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "verifications_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_formFieldId_form_fields_id_fk" FOREIGN KEY ("formFieldId") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_reviewFlowId_review_flows_id_fk" FOREIGN KEY ("reviewFlowId") REFERENCES "public"."review_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_creatorMemberId_members_id_fk" FOREIGN KEY ("creatorMemberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_folders" ADD CONSTRAINT "file_folders_formFieldId_form_fields_id_fk" FOREIGN KEY ("formFieldId") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_formFieldId_form_fields_id_fk" FOREIGN KEY ("formFieldId") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_shares" ADD CONSTRAINT "file_shares_fileId_files_id_fk" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaderMemberId_members_id_fk" FOREIGN KEY ("uploaderMemberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_formFieldId_form_fields_id_fk" FOREIGN KEY ("formFieldId") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_fileFolderId_file_folders_id_fk" FOREIGN KEY ("fileFolderId") REFERENCES "public"."file_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_templateFieldId_form_template_fields_id_fk" FOREIGN KEY ("templateFieldId") REFERENCES "public"."form_template_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_histories" ADD CONSTRAINT "form_histories_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_histories" ADD CONSTRAINT "form_histories_memberId_members_id_fk" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_creatorMemberId_members_id_fk" FOREIGN KEY ("creatorMemberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_executorMemberId_members_id_fk" FOREIGN KEY ("executorMemberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_templateId_form_templates_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."form_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flows" ADD CONSTRAINT "review_flows_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flows" ADD CONSTRAINT "review_flows_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_flows" ADD CONSTRAINT "review_flows_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_fields" ADD CONSTRAINT "form_template_fields_templateId_form_templates_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."form_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_fields" ADD CONSTRAINT "form_template_fields_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_creatorMemberId_members_id_fk" FOREIGN KEY ("creatorMemberId") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterId_users_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_lastModifiedBy_users_id_fk" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonatedBy_users_id_fk" FOREIGN KEY ("impersonatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_activeOrganizationId_organizations_id_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_activeOrganizationId_organizations_id_fk" FOREIGN KEY ("activeOrganizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;