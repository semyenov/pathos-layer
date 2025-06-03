import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),

  // Data
  logo: text("logo"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  metadata: text("metadata"),

  // References
  ownerId: text("ownerId").notNull(),
  lastModifiedBy: text("lastModifiedBy").notNull(),

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
  id: text("id").primaryKey(),

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
  impersonatedBy: text("impersonatedBy"),
  lastModifiedBy: text("lastModifiedBy"),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),

  // Data
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }).notNull(),
  ipAddress: text("ipAddress"),
  token: text("token").notNull(),
  userAgent: text("userAgent"),

  // References
  impersonatedBy: text("impersonatedBy").references(() => users.id),
  userId: text("userId")
    .references(() => users.id)
    .notNull(),
  activeOrganizationId: text("activeOrganizationId")
    .references(() => organizations.id),

  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),

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
  userId: text("userId")
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
  id: text("id").primaryKey(),

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
  id: text("id").primaryKey(),

  // Data
  role: organizationRoleEnum("role").notNull().default("member"),
  version: integer("version").default(1).notNull(),

  // References
  userId: text("userId")
    .references(() => users.id)
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
    .references(() => users.id)
    .notNull(),
  organizationId: text("organizationId")
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
  id: text("id").primaryKey(),

  // Data
  email: text("email").notNull(),
  role: organizationRoleEnum("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 })
    .defaultNow()
    .notNull(),
  token: text("token").notNull(),

  // References
  inviterId: text("inviterId")
    .references(() => users.id)
    .notNull(),
  organizationId: text("organizationId")
    .references(() => organizations.id)
    .notNull(),
  lastModifiedBy: text("lastModifiedBy")
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
