import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import {
  members,
  organizations,
  users
} from "./auth";

export const formFieldTypeEnum = pgEnum("FieldType", [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "checkbox",
  "radio",
  "file",
]);

export const formFieldStatusEnum = pgEnum("FieldStatus", [
  "draft",
  "rejected",
  "approved",
]);

export const formFields = pgTable("form_fields", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  options: text("options"),
  order: integer("order").notNull(),
  required: boolean("required").default(false).notNull(),
  status: formFieldStatusEnum("status").default("draft").notNull(),
  type: formFieldTypeEnum("type").default("text").notNull(),
  validationRules: text("validationRules"),
  description: text("description"),
  value: text("value"),

  formId: text("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  templateFieldId: text("templateFieldId")
    .references(() => templateFields.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const formStatusEnum = pgEnum("FormStatus", [
  "draft",
  "underReview",
  "needsChanges",
  "approved",
  "rejected",
]);

export const forms = pgTable("forms", {
  id: text("id").primaryKey(),

  title: text("title").notNull(),
  description: text("description"),
  status: formStatusEnum("status").default("draft").notNull(),
  version: integer("version").default(1).notNull(),

  // References
  creatorMemberId: text("creatorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  executorMemberId: text("executorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: text("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  templateId: text("templateId")
    .references(() => templates.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const templates = pgTable("form_templates", {
  id: text("id").primaryKey(),

  description: text("description"),
  name: text("name").unique().notNull(),
  version: integer("version").default(1).notNull(),

  // References
  creatorMemberId: text("creatorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: text("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const templateFields = pgTable("form_template_fields", {
  id: text("id").primaryKey(),

  defaultValue: text("defaultValue"),
  name: text("name").notNull(),
  options: text("options"),
  order: integer("order").notNull(),
  required: boolean("required").default(false).notNull(),
  type: formFieldTypeEnum("type").notNull(),
  validationRules: text("validationRules"),
  value: text("value"),
  description: text("description"),

  templateId: text("templateId")
    .references(() => templates.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const formHistories = pgTable("form_histories", {
  id: text("id").primaryKey(),

  data: text("data"),
  status: formStatusEnum("status").notNull(),
  version: integer("version").default(1).notNull(),

  // References
  formId: text("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  memberId: text("memberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const reviewFlowStatusEnum = pgEnum("ReviewFlowStatus", ["open", "closed"]);

export const reviewFlows = pgTable("review_flows", {
  id: text("id").primaryKey(),

  status: reviewFlowStatusEnum("status").default("open").notNull(),
  version: integer("version").default(1).notNull(),

  // References
  formId: text("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: text("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),

  content: text("content").notNull(),

  // References
  memberId: text("memberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  formId: text("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: text("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),
  reviewFlowId: text("reviewFlowId")
    .references(() => reviewFlows.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const fileShares = pgTable("file_shares", {
  id: text("id").primaryKey(),

  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }),

  // References
  memberId: text("memberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: text("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),
  fileId: text("fileId")
    .references(() => files.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const fileAccessLevelEnum = pgEnum("FileAccessLevel", [
  "private",
  "organization",
  "public",
]);

export const files = pgTable("files", {
  id: text("id").primaryKey(),

  accessLevel: fileAccessLevelEnum("accessLevel")
    .default("organization")
    .notNull(),
  accessedAt: timestamp("accessedAt", { mode: "date", precision: 3 }),
  deleted: boolean("deleted").default(false).notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  mimeType: text("mimeType").notNull(),
  originalName: text("originalName"),
  path: text("path").notNull(),
  size: integer("size").notNull(),

  // References
  organizationId: text("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  uploaderMemberId: text("uploaderMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: text("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),
  fileFolderId: text("fileFolderId")
    .references(() => fileFolders.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});

export const fileFolders = pgTable("file_folders", {
  id: text("id").primaryKey(),

  description: text("description"),
  level: integer("level").notNull(),
  name: text("name").notNull(),
  path: text("path"),
  version: integer("version").default(1).notNull(),

  // References
  parentId: text("parentId"),
  organizationId: text("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  creatorMemberId: text("creatorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: text("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});
