import {
  createAccessControl,
  type Role,
  type Statements,
} from "better-auth/plugins/access";
import {
  defaultStatements,
  memberAc as memberAcDefault,
  ownerAc as ownerAcDefault,
} from "better-auth/plugins/organization/access";

const statements: Statements = {
  ...defaultStatements,
} as const satisfies Statements;

export type OrganizationStatements = typeof statements;
export type OrganizationRole = Role<OrganizationStatements>;
export type OrganizationRolesEnum = "owner" | "member" | "executor" | "reviewer";
export type OrganizationRoles = Record<OrganizationRolesEnum, OrganizationRole>;

export const ac = createAccessControl(statements);

export const roles = {
  owner: ac.newRole({
    ...ownerAcDefault.statements,
  }),
  member: ac.newRole({
    ...memberAcDefault.statements,
  }),
  executor: ac.newRole({
    ...memberAcDefault.statements,
  }),
  reviewer: ac.newRole({
    ...memberAcDefault.statements,
  }),
} as const satisfies OrganizationRoles;
