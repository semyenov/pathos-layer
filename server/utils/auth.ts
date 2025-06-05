import { auth } from "../auth";

export type Auth = typeof auth;
export const useAuth = (): Auth => auth;

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
export type Invitation = typeof auth.$Infer.Invitation;
export type Organization = typeof auth.$Infer.Organization;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
export type Member = Omit<typeof auth.$Infer.Member, "user">;
export interface SessionContainer {
  user: User & { banned?: boolean };
  session: Session;

  activeOrganization?: {
    member: Member;
    organization: Organization;
  }
}
