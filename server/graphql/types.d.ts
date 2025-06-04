import type { GeoJSON } from 'geojson';

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
  admin: boolean;
  logged: boolean;
  organization: boolean;
  organizationOwner: boolean;
  organizationMember: boolean;
}

