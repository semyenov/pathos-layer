import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  openAPI as openAPIPlugin,
  organization as organizationPlugin,
  jwt as jwtPlugin,
} from "better-auth/plugins";
import { adminPermissions, organizationPermissions } from "./permissions";
import { tables } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";

// Define types for organization hooks
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  user: {
    changeEmail: { enabled: true },
    fields: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      email: "email",
      emailVerified: "emailVerified",
      image: "image",
      name: "name",
      role: "role",
    },
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
    expiresIn: 60 * 60 * 30, // 30 hours
    freshAge: 60 * 60, // 1 hour
    updateAge: 60 * 60 * 2, // 2 hours
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 30, // 30 hours
      expires: new Date(Date.now() + 60 * 60 * 30 * 1000), // 30 hours
      path: "/",
      domain:
        process.env.NODE_ENV === "production" ? "formflow.ai" : "localhost",
    },
  },

  database: drizzleAdapter(useDb(), {
    provider: "pg",
    schema: tables,
    debugLogs: false,
    usePlural: true,
  }),

  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    adminPlugin({
      defaultRole: "user",
      adminUserIds: ["superadmin"],
      ac: adminPermissions.ac,
      roles: adminPermissions.roles,
      adminRoles: Object.keys(organizationPermissions.roles),
      bannedUserMessage: "You have been banned from the platform",
    }),

    organizationPlugin({
      creatorRole: "owner",
      ac: organizationPermissions.ac,
      roles: organizationPermissions.roles,

      allowUserToCreateOrganization(_user) {
        return true;
      },

      organizationCreation: {
        beforeCreate: async ({ organization }) => {
          const slug = organization.slug
            .replace(/ /g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .toLowerCase();

          const name = organization.name
            .replace(/ /g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .toUpperCase();

          const existingOrganization = await useDb()
            .select()
            .from(tables.organizations)
            .where(
              or(
                eq(tables.organizations.slug, slug),
                eq(tables.organizations.name, name),
              ),
            )
            .limit(1);
          if (existingOrganization.length > 0)
            throw new Error(
              "Organization with this name or slug already exists",
            );

          return {
            data: {
              ...organization,
              name,
              slug,
            },
          };
        },
        afterCreate: async ({ organization, user, member }) => {
          await useDb().insert(tables.organizations).values({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo,
            ownerId: member.id,
            lastModifiedBy: user.id,
            metadata: organization.metadata,
          });
          await useDb().insert(tables.members).values({
            id: member.id,
            userId: user.id,
            role: "owner",
            organizationId: organization.id,
            lastModifiedBy: user.id,
            version: 1,
          });
        },
      },

      canInviteUser: async () => {
        // Only owners and admins can invite users
        return true;
      },
      canRemoveMember: async () => {
        // Owners can remove anyone, admins can remove non-owners/admins
        return true;
      },
    }),

    openAPIPlugin({
      disableDefaultReference: false,
      path: "/api/auth/openapi.json",
    }),

    jwtPlugin({
      schema: {
        jwks: {
          modelName: "jwks",
          fields: {
            publicKey: "string",
            privateKey: "string",
            createdAt: "date",
          },
        },
      },
      jwks: {
        disablePrivateKeyEncryption: true,
        keyPairConfig: { alg: "ES256" },
      },
      jwt: {
        issuer: "https://api.formflow.ai",
        audience: "https://api.formflow.ai",
        expirationTime: "1d",
        definePayload: ({ session, user }) => {
          const createdAt = session.createdAt;
          const expiresIn = session.expiresAt.getTime() - createdAt.getTime();
          return {
            id: crypto.randomUUID(),
            sessionId: session.id,
            userId: user.id,
            email: user.email,
            role: user.role,

            organizationId: session.activeOrganizationId,

            iat: Math.floor(createdAt.getTime() / 1000),
            exp: Math.floor(expiresIn / 1000),
          };
        },
      },
    }),
  ],
});
