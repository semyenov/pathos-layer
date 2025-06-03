import type { CookieSameSite } from "@whatwg-node/cookie-store";
import type { Builder } from "../builder";

import { eq } from "drizzle-orm";
import { hash } from "node:crypto";

export function addAuthTypes(builder: Builder) {
  const AccountType = builder.drizzleNode("accounts", {
    name: "Account",
    id: { column: (account) => account.id },
    fields: (t) => ({
      userId: t.exposeID("userId"),
      providerId: t.exposeID("providerId"),
      accessToken: t.exposeString("accessToken", { nullable: true }),
      accessTokenExpiresAt: t.expose("accessTokenExpiresAt", { type: "Date", nullable: true }),
      refreshToken: t.exposeString("refreshToken", { nullable: true }),
      refreshTokenExpiresAt: t.expose("refreshTokenExpiresAt", { type: "Date", nullable: true }),
      idToken: t.exposeString("idToken", { nullable: true }),
      scope: t.exposeString("scope", { nullable: true }),
      createdAt: t.expose("createdAt", { type: "Date" }),
      updatedAt: t.expose("updatedAt", { type: "Date" }),
      user: t.relation("user", { nullable: true }),
    }),
  });

  const UserRoleEnumType = builder.enumType("UserRole", {
    values: {
      admin: { value: "admin" },
      user: { value: "user" },
    },
  });

  const UserType = builder.drizzleNode("users", {
    name: "User",
    id: { column: (user) => user.id },
    fields: (t) => ({
      banExpires: t.expose("banExpires", { type: "Date", nullable: true }),
      banned: t.exposeBoolean("banned", { nullable: true }),
      banReason: t.exposeString("banReason", { nullable: true }),
      emailVerified: t.exposeBoolean("emailVerified", { nullable: true }),
      image: t.exposeString("image", { nullable: true }),
      name: t.exposeString("name"),
      email: t.exposeString("email"),
      role: t.expose("role", { type: UserRoleEnumType, nullable: true }),
      createdAt: t.expose("createdAt", { type: "Date" }),
      updatedAt: t.expose("updatedAt", { type: "Date" }),
      members: t.relation("members", { nullable: true }),
      sessions: t.relation("sessions", { nullable: true }),
      accounts: t.relation("accounts", { nullable: true }),
    }),
  });

  // Query to get the current user
  const meQuery = builder.queryField("me", (t) =>
    t.field({
      type: UserType,
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, context) => {
        if (!context.session?.userId) {
          throw new Error("Not authenticated");
        }

        const foundUser = await context.db.query.users.findFirst({
          where: { id: context.session.userId },
          with: {
            members: {
              with: {
                organization: true,
              },
            },
            sessions: true,
            accounts: true,
          },
        });

        if (!foundUser) {
          throw new Error("User not found");
        }

        return foundUser;
      },
    }),
  );

  // Query to get users (admin only)
  const usersQuery = builder.queryField("users", (t) =>
    t.field({
      type: [UserType],
      authScopes: {
        admin: true,
      },
      resolve: async (_, __, context) => {
        const foundUsers = await context.db.query.users.findMany();
        return foundUsers;
      },
    }),
  );

  // Login input type
  const LoginInputType = builder.inputType("LoginInput", {
    fields: (t) => ({
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  });

  // Register input type
  const RegisterInputType = builder.inputType("RegisterInput", {
    fields: (t) => ({
      name: t.string({ required: true }),
      email: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  });

  // Login mutation
  const loginMutation = builder.mutationField("login", (t) =>
    t.field({
      type: "String",
      args: {
        input: t.arg({ type: LoginInputType, required: true }),
      },
      resolve: async (_, { input }, context) => {
        const session = await context.auth.api.signInEmail({
          body: {
            email: input.email,
            password: input.password,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!session) {
          throw new Error("Invalid email or password");
        }

        const { authCookies: { sessionToken: { name, options } } } = await context.auth.$context;
        const { token } = await context.auth.api.signInEmail({
          body: {
            email: input.email,
            password: input.password,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!token) {
          throw new Error("Failed to login");
        }

        await context.cookies.set({
          ...options,

          name: name,
          value: token ?? "",
          domain: options.domain ?? null,
          expires: options.expires ?? null,
          sameSite: options.sameSite as CookieSameSite,
        });

        return token;
      },
    }),
  );

  // Register mutation
  const registerMutation = builder.mutationField("register", (t) =>
    t.field({
      type: "String",
      args: {
        input: t.arg({ type: RegisterInputType, required: true }),
      },
      resolve: async (_, { input }, context) => {
        const { token } = await context.auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
          },
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!token) {
          throw new Error("Failed to create user");
        }

        const {
          authCookies: {
            sessionToken: {
              name,
              options,
            }
          }
        } = await context.auth.$context;

        await context.cookies.set({
          ...options,

          name: name,
          value: token,
          domain: options.domain ?? null,
          expires: options.expires ?? null,
          sameSite: options.sameSite as CookieSameSite,
        });

        return token;
      },
    }),
  );

  // Logout mutation
  const logoutMutation = builder.mutationField("logout", (t) =>
    t.boolean({
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, context) => {
        const session = await context.auth.api.signOut({
          headers: { "Content-Type": "application/json" },
        });

        if (session.success) {
          const {
            authCookies: { sessionToken: { name } }
          } = await context.auth.$context;
          context.cookies.delete(name);

          return true;
        }

        return false;
      },
    }),
  );

  const UpdateUserInputType = builder.inputType("UpdateUserInput", {
    fields: (t) => ({
      name: t.string({ required: false, description: "The name of the user" }),
      email: t.string({ required: false, description: "The email of the user" }),
      password: t.string({ required: false, description: "The password of the user" }),
      image: t.string({ required: false, description: "The image of the user" }),
      banned: t.boolean({ required: false, description: "Whether the user is banned" }),
      banReason: t.string({ required: false, description: "The reason the user is banned" }),
      banExpires: t.int({ required: false, description: "The date and time the user's ban expires" }),
      role: t.field({ required: false, type: UserRoleEnumType, defaultValue: "user", description: "The role of the user" }),
      emailVerified: t.boolean({ required: false, description: "Whether the user's email is verified" }),
      createdAt: t.int({ required: false, description: "The date and time the user was created" }),
      updatedAt: t.int({ required: false, description: "The date and time the user was last updated" }),
    }),
  });

  const updateUserMutation = builder.mutationField("updateUser", (t) =>
    t.field({
      type: UserType,
      args: {
        input: t.arg({
          type: UpdateUserInputType,
          required: true,
        }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, { input }, context) => {
        if (!context.session?.userId) {
          throw new Error("Not authenticated");
        }

        const foundUser = await context.db.query.users.findFirst({
          where: { id: context.session.userId },
          with: { accounts: true },
        });

        if (!foundUser) {
          throw new Error("User not found");
        }

        const {
          name,
          email,
          password,
          image,
          banned,
          banReason,
          banExpires,
          role,
          emailVerified,
          createdAt,
          updatedAt
        } = input;

        if (password) {
          const hashedPassword = hash(password, "sha256");
          await context.db.update(tables.accounts).set({
            password: hashedPassword,
          }).where(eq(tables.accounts.userId, foundUser.id));
        }

        await context.db
          .update(tables.users)
          .set({
            name: name ?? foundUser.name,
            email: email ?? foundUser.email,
            image: image ?? foundUser.image,
            banned: banned ?? foundUser.banned,
            role: role ?? foundUser.role,
            emailVerified: emailVerified ?? foundUser.emailVerified,
            createdAt: createdAt ? new Date(createdAt) : foundUser.createdAt,
            updatedAt: updatedAt ? new Date(updatedAt) : foundUser.updatedAt,
          })
          .where(eq(tables.users.id, foundUser.id));

        if (banReason) {
          await context.db.update(tables.users).set({
            banReason: banReason,
            banExpires: banExpires ? new Date(banExpires) : foundUser.banExpires,
          }).where(eq(tables.users.id, foundUser.id));
        }

        const updatedUser = await context.db.query.users.findFirst({
          where: { id: foundUser.id },
          with: { accounts: true },
        });

        return updatedUser ?? foundUser ?? null;
      },
    }),
  );

  return {
    AccountType,
    UserType,
    UserRoleEnumType,
    LoginInputType,
    RegisterInputType,

    loginMutation,
    registerMutation,
    logoutMutation,
    updateUserMutation,
    meQuery,
    usersQuery,
  };
}
