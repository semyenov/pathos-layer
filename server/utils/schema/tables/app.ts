import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
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
  id: uuid("id")
    .primaryKey()
    .defaultRandom(),

  name: text("name").notNull(),
  options: text("options"),
  order: integer("order").notNull(),
  required: boolean("required").default(false).notNull(),
  status: formFieldStatusEnum("status").default("draft").notNull(),
  type: formFieldTypeEnum("type").default("text").notNull(),
  validationRules: text("validationRules"),
  description: text("description"),
  value: text("value"),

  formId: uuid("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  templateFieldId: uuid("templateFieldId")
    .references(() => templateFields.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
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
  id: uuid("id").primaryKey().defaultRandom(),

  title: text("title").notNull(),
  description: text("description"),
  status: formStatusEnum("status").default("draft").notNull(),
  version: integer("version").default(1).notNull(),

  // References
  creatorMemberId: uuid("creatorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  executorMemberId: uuid("executorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: uuid("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  templateId: uuid("templateId")
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
  id: uuid("id").primaryKey().defaultRandom(),

  description: text("description"),
  name: text("name").unique().notNull(),
  version: integer("version").default(1).notNull(),

  // References
  creatorMemberId: uuid("creatorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: uuid("organizationId")
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
  id: uuid("id").primaryKey().defaultRandom(),

  defaultValue: text("defaultValue"),
  name: text("name").notNull(),
  options: text("options"),
  order: integer("order").notNull(),
  required: boolean("required").default(false).notNull(),
  type: formFieldTypeEnum("type").notNull(),
  validationRules: text("validationRules"),
  value: text("value"),
  description: text("description"),

  templateId: uuid("templateId")
    .references(() => templates.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
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
  id: uuid("id").primaryKey().defaultRandom(),

  data: text("data"),
  status: formStatusEnum("status").notNull(),
  version: integer("version").default(1).notNull(),

  // References
  formId: uuid("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  memberId: uuid("memberId")
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
  id: uuid("id").primaryKey().defaultRandom(),

  status: reviewFlowStatusEnum("status").default("open").notNull(),
  version: integer("version").default(1).notNull(),

  // References
  formId: uuid("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: uuid("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
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
  id: uuid("id").primaryKey().defaultRandom(),

  content: text("content").notNull(),

  // References
  memberId: uuid("memberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  formId: uuid("formId")
    .references(() => forms.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: uuid("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),
  reviewFlowId: uuid("reviewFlowId")
    .references(() => reviewFlows.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
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
  id: uuid("id").primaryKey().defaultRandom(),

  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }),

  // References
  memberId: uuid("memberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: uuid("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),
  fileId: uuid("fileId")
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
  id: uuid("id").primaryKey().defaultRandom(),

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
  organizationId: uuid("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  uploaderMemberId: uuid("uploaderMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: uuid("formFieldId")
    .references(() => formFields.id, { onDelete: "cascade" })
    .notNull(),
  fileFolderId: uuid("fileFolderId")
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
  id: uuid("id").primaryKey().defaultRandom(),

  description: text("description"),
  level: integer("level").notNull(),
  name: text("name").notNull(),
  path: text("path"),
  version: integer("version").default(1).notNull(),

  // References
  parentId: uuid("parentId"),
  organizationId: uuid("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  creatorMemberId: uuid("creatorMemberId")
    .references(() => members.id, { onDelete: "cascade" })
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  formFieldId: uuid("formFieldId")
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
