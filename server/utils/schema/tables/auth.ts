
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data
  logo: text("logo"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  metadata: text("metadata"),

  // References
  ownerId: uuid("ownerId").notNull(),
  lastModifiedBy: uuid("lastModifiedBy").notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const userRoleEnum = pgEnum("userRoleEnum", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("user"),
  banned: boolean("banned"),
  banExpires: timestamp("banExpires", { mode: "date", precision: 3 }),
  banReason: text("banReason"),

  // References
  activeOrganizationId: uuid("activeOrganizationId")
    .references(() => organizations.id)
    .notNull(),
  impersonatedBy: uuid("impersonatedBy"),
  lastModifiedBy: uuid("lastModifiedBy"),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }).notNull(),
  ipAddress: text("ipAddress"),
  token: text("token").notNull(),
  userAgent: text("userAgent"),

  // References
  impersonatedBy: uuid("impersonatedBy").references(() => users.id),
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),
  activeOrganizationId: uuid("activeOrganizationId")
    .references(() => organizations.id)
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data
  scope: text("scope"),
  accessToken: text("accessToken"),
  idToken: text("idToken"),
  password: text("password"),
  providerId: text("providerId").notNull(),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
    mode: "date",
    precision: 3,
  }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
    mode: "date",
    precision: 3,
  }),

  // References
  accountId: text("accountId").notNull().unique(),
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),

  identifier: text("identifier").notNull().unique(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const organizationRoleEnum = pgEnum("organizationRoleEnum", [
  "owner",
  "reviewer",
  "executor",
  "member",
]);

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data
  role: organizationRoleEnum("role").notNull().default("member"),
  version: integer("version").default(1).notNull(),

  // References
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
    .references(() => users.id)
    .notNull(),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data
  email: text("email").notNull(),
  role: organizationRoleEnum("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  token: text("token").notNull(),

  // References
  inviterId: uuid("inviterId")
    .references(() => users.id)
    .notNull(),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),
  lastModifiedBy: uuid("lastModifiedBy")
    .references(() => users.id)
    .notNull(),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});