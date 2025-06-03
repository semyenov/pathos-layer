import type { Scalars, AuthScopes, Context } from './types';

import DrizzlePlugin from '@pothos/plugin-drizzle';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import TracingPlugin from '@pothos/plugin-tracing';
import ValidationPlugin from '@pothos/plugin-validation';
import WithInputPlugin from '@pothos/plugin-with-input';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { DateResolver, JSONResolver, ObjectIDResolver } from 'graphql-scalars';
import SchemaBuilder from '@pothos/core';

import { addAuthTypes } from './types/auth';
import { addOrganizationTypes } from './types/organization';
import { addTemplateTypes } from './types/template';
import { addCommentTypes } from './types/comment';
import { addReviewFlowTypes } from './types/reviewFlow';
import { addSessionTypes } from './types/session';
import { addMemberTypes } from './types/member';

const builder = new SchemaBuilder<{
  Defaults: "v4";
  DefaultFieldNullability: false;
  Tracing: boolean | { formatMessage: (duration: number) => string };
  DrizzleRelations: DrizzleRelations;
  DrizzleTables: DrizzleTables;
  Context: Context;
  Scalars: Scalars;
  AuthScopes: AuthScopes;
}>({
  defaults: "v4",
  defaultFieldNullability: false,

  withInput: {
    typeOptions: {
      name: (options) => `${options.parentTypeName}${options.fieldName}Input`,
    },
  },


  drizzle: {
    client: useDb(),
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
    authorizeOnSubscribe: true,
    runScopesOnType: true,

    authScopes: async (context) => {
      return {
        loggedIn: context.user !== null,
        admin: context.member?.role === "admin",
        organization: context.session?.activeOrganizationId !== null,
        organizationOwner:
          context.member?.role === "owner" &&
          context.member?.organizationId ===
            context.session?.activeOrganizationId,
      };
    },
  },
});

builder.addScalarType("ID", ObjectIDResolver);
builder.addScalarType("Date", DateResolver);
builder.addScalarType("JSON", JSONResolver);

builder.queryType({ description: "The root query type" });
builder.mutationType({ description: "The root mutation type" });

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
