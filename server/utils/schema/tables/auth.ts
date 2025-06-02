import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const userRole = pgEnum("UserRole", [
  "user",
  "admin",
]);

const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  role: userRole("role").notNull().default("user"),
  banned: boolean("banned"),
  banExpires: timestamp("banExpires", { mode: "date", precision: 3 }),
  banReason: text("banReason"),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }).notNull(),
  ipAddress: text("ipAddress"),
  token: text("token").notNull(),
  userAgent: text("userAgent"),

  activeOrganizationId: uuid("activeOrganizationId").references(() => organizations.id, { onDelete: "cascade" }),
  impersonatedBy: uuid("impersonatedBy").references(() => users.id, { onDelete: "cascade" }),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),

  accountId: text("accountId").notNull(),
  scope: text("scope"),
  accessToken: text("accessToken"),
  idToken: text("idToken"),
  password: text("password"),
  providerId: text("providerId").notNull(),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date", precision: 3 }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date", precision: 3 }),

  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),

  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }).defaultNow().notNull(),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),

  logo: text("logo"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  metadata: text("metadata"),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

const memberRole = pgEnum("MemberRole", [
  "owner",
  "reviewer",
  "executor",
  "member",
]);

const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),

  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastModifiedBy: uuid("lastModifiedBy").references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),

  role: memberRole("role").notNull().default("member"),
  version: integer("version").default(1).notNull(),
});

const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),

  email: text("email").notNull(),
  role: memberRole("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }).defaultNow().notNull(),

  organizationId: uuid("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  inviterId: uuid("inviterId").references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).defaultNow().notNull(),
});

export default {
  users,
  userRole,
  sessions,
  accounts,
  verifications,
  organizations,
  members,
  memberRole,
  invitations,
};