import { DateResolver, JSONResolver, ObjectIDResolver, GeoJSONResolver } from "graphql-scalars";

import DrizzlePlugin from "@pothos/plugin-drizzle";
import RelayPlugin from "@pothos/plugin-relay";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import TracingPlugin from "@pothos/plugin-tracing";
import ValidationPlugin from "@pothos/plugin-validation";
import WithInputPlugin from "@pothos/plugin-with-input";
import { getTableConfig } from "drizzle-orm/pg-core";
import SchemaBuilder from "@pothos/core";

import type { AuthScopes, Context, Scalars } from "./types";

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

  withInput: {
    typeOptions: {
      name: (options) => `${options.parentTypeName}${options.fieldName}Input`,
    },
    argOptions: {
      required: true,
    },
  },

  relay: {
    cursorType: "String",
    idFieldName: "id",
    idFieldOptions: {
      tracing: true,
      description: "The ID of the node",
    },
    nodesFieldOptions: {
      tracing: true,
      nullable: false,
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
    authScopes: (context) => {
      return {
        loggedIn: context.user !== null,
        admin: context.user?.role === "admin",
        organization: context.session?.activeOrganizationId !== null,
        organizationOwner:
          context.member?.role === "owner" &&
          context.member?.organizationId === context.session?.activeOrganizationId,
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
