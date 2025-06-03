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
};

export type OrganizationRole = "owner" | "member" | "executor" | "reviewer";

export const ac = createAccessControl(statements);
export const roles: Record<OrganizationRole, Role> = {
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
};
