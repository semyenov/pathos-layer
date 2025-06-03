import {
  createAccessControl,
  type Role,
  type Statements,
} from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc as adminAcDefault,
  userAc as userAcDefault,
} from "better-auth/plugins/admin/access";

const statements: Statements = {
  ...defaultStatements,
};

export type AdminRoles = "admin" | "user";
export type AdminRole = Role<Statements>;

export const ac = createAccessControl(statements);
export const roles: Record<AdminRoles, AdminRole> = {
  admin: ac.newRole({
    ...adminAcDefault.statements,
  }),
  user: ac.newRole({
    ...userAcDefault.statements,
  }),
};
