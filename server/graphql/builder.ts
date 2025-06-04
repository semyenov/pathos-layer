import type { Context, AuthScopes, Scalars } from "./types";

import { DateResolver, JSONResolver, ObjectIDResolver, GeoJSONResolver } from "graphql-scalars";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import RelayPlugin from "@pothos/plugin-relay";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import TracingPlugin from "@pothos/plugin-tracing";
import ValidationPlugin from "@pothos/plugin-validation";
import WithInputPlugin from "@pothos/plugin-with-input";
import { getTableConfig } from "drizzle-orm/pg-core";
import SchemaBuilder from "@pothos/core";

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

  validationOptions: {
    validationError: (error) => {
      console.log("validation error", error);
      return error;
    },
  },

  tracing: {
    default() {
      return true;
    },
    wrap(config) {
      return async (...params: Parameters<typeof config>) => {
        const [source, args, context, info] = params;
        const start = performance.now();
        const result = await config(source, args, context, info);
        const end = performance.now();
        const duration = end - start;

        console.log({
          fieldName: info.fieldName,
          args: JSON.stringify(args),
          duration,
        });

        return result;
      };
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
    defaultStrategy: "any",
    treatErrorsAsUnauthorized: false,

    authScopes: async (ctx) => {
      console.log("authScopes", ctx.event.headers);
      const sessionData = await ctx.event.context.auth.api.getSession(ctx.event);
      console.log("sessionData", sessionData);

      if (!sessionData) {
        return {
          loggedIn: false,
          admin: false,
          organization: false,
          organizationOwner: false,
          organizationMember: false,
        };
      }

      const session = sessionData?.session;
      const user = sessionData?.user;

      if (!session || !user) {
        return {
          loggedIn: false,
          admin: false,
          organization: false,
          organizationOwner: false,
          organizationMember: false,
        };
      }

      return {
        loggedIn:
          user !== null,
        admin:
          user.role === "admin",
        organization:
          session.activeOrganizationId !== null,
        organizationOwner:
          user.role === "owner" &&
          session.activeOrganizationId === session.activeOrganizationId,
        organizationMember: user.role === "member" &&
          session.activeOrganizationId === session.activeOrganizationId,
      };
    },
  },
});

builder.addScalarType("ID", ObjectIDResolver);
builder.addScalarType("Date", DateResolver);
builder.addScalarType("JSON", JSONResolver);
builder.addScalarType("GeoJSON", GeoJSONResolver);

builder.queryType({ description: "The root query type" });
builder.mutationType({ description: "The root mutation type" });

export type Builder = typeof builder;
export const useBuilder = () => builder;
