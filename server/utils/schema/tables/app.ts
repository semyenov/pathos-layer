import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

import auth from "./auth";

export const formStatus = pgEnum("FormStatus", [
  "draft",
  "under_review",
  "needs_changes",
  "approved",
  "rejected",
]);

const forms = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: text("title").notNull(),
  description: text("description"),
  status: formStatus("status").default("draft").notNull(),
  version: integer("version").default(1).notNull(),

  creatorMemberId: uuid("creatorMemberId").notNull().references(() => auth.members.id),
  executorMemberId: uuid("executorMemberId").references(() => auth.members.id),
  lastModifiedBy: uuid("lastModifiedBy").references(() => auth.users.id),
  organizationId: uuid("organizationId").notNull().references(() => auth.organizations.id),
  templateId: uuid("templateId").references(() => templates.id).notNull(),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const fieldType = pgEnum("FieldType", [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "radio",
  "file",
]);

const formFieldStatus = pgEnum("FormFieldStatus", [
  "draft",
  "rejected",
  "approved",
]);

const formFields = pgTable("form_fields", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  options: text("options"),
  order: integer("order").notNull(),
  required: boolean("required").default(false).notNull(),
  status: formFieldStatus("status").default("draft").notNull(),
  type: fieldType("type").notNull(),
  validationRules: text("validationRules"),
  value: text("value"),

  formId: uuid("formId").notNull().references(() => forms.id, { onDelete: "cascade" }),
  templateFieldId: uuid("templateFieldId").references(() => templateFields.id),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const templates = pgTable("form_templates", {
  id: uuid("id").primaryKey().defaultRandom(),

  description: text("description"),
  name: text("name").notNull(),
  version: integer("version").default(1).notNull(),

  organizationId: uuid("organizationId").notNull().references(() => auth.organizations.id),
  lastModifiedBy: uuid("lastModifiedBy").references(() => auth.users.id),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const templateFields = pgTable("form_template_fields", {
  id: uuid("id").primaryKey().defaultRandom(),

  defaultValue: text("defaultValue"),
  name: text("name").notNull(),
  options: text("options"),
  order: integer("order").notNull(),
  required: boolean("required").default(false).notNull(),
  type: fieldType("type").notNull(),
  validationRules: text("validationRules"),

  templateId: uuid("templateId").notNull().references(() => templates.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const formHistories = pgTable("form_histories", {
  id: uuid("id").primaryKey().defaultRandom(),

  data: text("data"),
  status: formStatus("status").notNull(),
  version: integer("version").default(1).notNull(),

  formId: uuid("formId").notNull().references(() => forms.id, { onDelete: "cascade" }),
  memberId: uuid("memberId").notNull().references(() => auth.members.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const reviewFlowStatus = pgEnum("ReviewFlowStatus", [
  "open",
  "closed",
]);

const reviewFlows = pgTable("review_flows", {
  id: uuid("id").primaryKey().defaultRandom(),

  status: reviewFlowStatus("status").default("open").notNull(),
  version: integer("version").default(1).notNull(),

  formId: uuid("formId").notNull().references(() => forms.id, { onDelete: "cascade" }),
  organizationId: uuid("organizationId").notNull().references(() => auth.organizations.id),
  lastModifiedBy: uuid("lastModifiedBy").references(() => auth.users.id),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),

  content: text("content").notNull(),

  memberId: uuid("memberId").notNull().references(() => auth.members.id, { onDelete: "cascade" }),
  reviewFlowId: uuid("reviewFlowId").notNull().references(() => reviewFlows.id, { onDelete: "cascade" }),
  formFieldId: uuid("formFieldId").references(() => formFields.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

const fileAccess = pgEnum("FileAccess", [
  "private",
  "organization",
  "public",
]);

const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),

  accessLevel: fileAccess("accessLevel").default("organization").notNull(),
  accessedAt: timestamp("accessedAt", { mode: "date", precision: 3 }),
  deleted: boolean("deleted").default(false).notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  mimeType: text("mimeType").notNull(),
  originalName: text("originalName"),
  path: text("path").notNull(),
  size: integer("size").notNull(),

  organizationId: uuid("organizationId").notNull().references(() => auth.organizations.id),
  uploaderMemberId: uuid("uploaderMemberId").notNull().references(() => auth.members.id),
  folderId: uuid("folderId").references(() => fileFolders.id),
  lastModifiedBy: uuid("lastModifiedBy").references(() => auth.users.id),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

export const fileFolders = pgTable("file_folders", {
  id: uuid("id").primaryKey().defaultRandom(),

  description: text("description"),
  level: integer("level").notNull(),
  name: text("name").notNull(),
  parentId: uuid("parentId"),
  path: text("path"),
  version: integer("version").default(1).notNull(),

  organizationId: uuid("organizationId").notNull().references(() => auth.organizations.id),
  creatorMemberId: uuid("creatorMemberId").notNull().references(() => auth.members.id),
  lastModifiedBy: uuid("lastModifiedBy").references(() => auth.users.id),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

export const fileShares = pgTable("file_shares", {
  id: uuid("id").primaryKey().defaultRandom(),

  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }),

  fileId: uuid("fileId").notNull().references(() => files.id, { onDelete: "cascade" }),
  memberId: uuid("memberId").notNull().references(() => auth.members.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

export const formFieldFiles = pgTable("form_field_files", {
  id: uuid("id").primaryKey().defaultRandom(),

  fileId: uuid("fileId").notNull().references(() => files.id, { onDelete: "cascade" }),
  formFieldId: uuid("formFieldId").notNull().references(() => formFields.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().defaultNow(),
});

export default {
  forms,
  formFields,
  templateFields,
  templates,
  formHistories,
  reviewFlows,
  comments,
  files,
  fileFolders,
  fileShares,
  formFieldFiles,
};