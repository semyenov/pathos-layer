import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin as adminPlugin,
  openAPI as openAPIPlugin,
  organization as organizationPlugin,
} from "better-auth/plugins";

import {
  adminPermissions,
  organizationPermissions,
} from "./permissions";

// Define types for organization hooks
export const auth = betterAuth({
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
      defaultRole: "user",
      adminUserIds: ["superadmin"],
      ac: adminPermissions.ac,
      roles: adminPermissions.roles,
    }),
    organizationPlugin({
      creatorRole: "owner",
      ac: organizationPermissions.ac,
      roles: organizationPermissions.roles,

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
      disableDefaultReference: false,
      path: "/api/auth/openapi.json",
    }),
  ],
});
