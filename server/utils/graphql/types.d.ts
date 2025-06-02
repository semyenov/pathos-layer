import type { CookieStore } from '@whatwg-node/cookie-store';
import type { Member, Organization } from 'better-auth/plugins/organization';
import type { DB } from '../db';
import type { Auth } from '../auth';
import type { Session } from '../auth';
import type { User } from '../auth';

export interface Context {
  db: DB;
  auth: Auth;
  cookies: CookieStore;

  user: User | null;
  member: Member | null;
  session: Session | null;
  organization: Organization | null;
}

export type Scalars = {
  ID: {
    Input: string;
    Output: string;
  };
  Date: {
    Input: Date;
    Output: Date;
  };
  JSON: {
    Input: unknown;
    Output: unknown;
  };

};

export interface AuthScopes {
  loggedIn: boolean;
  admin: boolean;
  organization: boolean;
}

