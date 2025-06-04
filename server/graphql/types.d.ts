import type { GeoJSON } from 'geojson';
import type { CookieStore } from '@whatwg-node/cookie-store';

import type {
  Auth,
  Session,
  User,
  Member,
  Organization,
} from '../utils/auth';


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
  GeoJSON: {
    Input: GeoJSON;
    Output: GeoJSON;
  };
};

export interface AuthScopes {
  loggedIn: boolean;
  admin: boolean;
  organization: boolean;
}

