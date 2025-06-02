
import DrizzlePlugin from '@pothos/plugin-drizzle';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import TracingPlugin from '@pothos/plugin-tracing';
import ValidationPlugin from '@pothos/plugin-validation';
import WithInputPlugin from '@pothos/plugin-with-input';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { DateResolver, JSONResolver, ObjectIDResolver } from 'graphql-scalars';
import type { Scalars, AuthScopes, Context } from './types';
import SchemaBuilder from '@pothos/core';

import { addAuthTypes } from './types/auth';
import { addOrganizationTypes } from './types/organization';
import { addTemplateTypes } from './types/template';
import { addCommentTypes } from './types/comment';
import { addReviewFlowTypes } from './types/reviewFlow';
import { addSessionTypes } from './types/session';
import { addMemberTypes } from './types/member';

const db = useDb();

const builder = new SchemaBuilder<{
  Defaults: 'v4';
  DefaultFieldNullability: false;
  Tracing: boolean | { formatMessage: (duration: number) => string };
  DrizzleRelations: DrizzleRelations;
  DrizzleTables: typeof tables;
  Context: Context;
  Scalars: Scalars;
  AuthScopes: AuthScopes;
}>({
  defaults: 'v4',
  defaultFieldNullability: false,
  drizzle: {
    client: db,
    relations: relations,
    skipDeferredFragments: true,
    defaultConnectionSize: 10,
    maxConnectionSize: 100,
    getTableConfig,
  },
  plugins: [
    TracingPlugin,
    DrizzlePlugin,
    ValidationPlugin,
    ScopeAuthPlugin,
    WithInputPlugin,
    RelayPlugin,
  ],


  scopeAuth: {
    authScopes: async (context) => {
      return {
        loggedIn: !!context.session,
        admin: context.member?.role === 'admin',
        organization: context.member?.organizationId !== null,
      };
    },
  },
});

builder.addScalarType('JSON', JSONResolver);
builder.addScalarType('Date', DateResolver);
builder.addScalarType("ID", ObjectIDResolver);

builder.queryType({
  description: 'The root query type',
});

builder.mutationType({
  description: 'The root mutation type',
});

builder.queryType({
  description: 'The root query type',
});

builder.mutationType({
  description: 'The root mutation type',
});

export type Builder = typeof builder;
export const useBuilder = () => builder;

addSessionTypes(builder);
addAuthTypes(builder);
addMemberTypes(builder);
addOrganizationTypes(builder);
addTemplateTypes(builder);
addCommentTypes(builder);
addReviewFlowTypes(builder);

const schema = builder.toSchema({ sortSchema: true });

export type Schema = typeof schema;
export const useSchema = (): Schema => schema;
