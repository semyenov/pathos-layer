import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  openAPI as openAPIPlugin,
  organization as organizationPlugin,
} from "better-auth/plugins";

// Define types for organization hooks
const auth = betterAuth({
  session: {
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
  },
  database: drizzleAdapter(useDb(), {
    provider: "pg",
    schema: tables,
    usePlural: true,
    debugLogs: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    adminPlugin({
      defaultRole: "admin",
      adminUserIds: ["superadmin"],
    }),
    organizationPlugin({
      allowUserToCreateOrganization(_user) {
        return true;
      },
      onUserJoinOrganization: async () => {
        // Store the appropriate role  in the database
        // Default to 'member' role
        return { role: "member" };
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
      path: "/api/auth/openapi.json",
    }),
  ],
});

export type Auth = typeof auth;
export const useAuth = (): Auth => auth;

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
export type Invitation = typeof auth.$Infer.Invitation;
export type Organization = typeof auth.$Infer.Organization;
export type Member = typeof auth.$Infer.Member;
