import type { GeoJSON } from 'geojson';
import type { H3Event } from 'h3';
import type {
  Auth,
  Session,
  User,
  Member,
  Organization,
} from '../utils/auth';


export interface Context {
  event: H3Event;

  // Database
  db: DB;
  auth: Auth;

  // Auth
  user: User | null;
  session: Session | null;

  // Organization
  member: Member | null;
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

