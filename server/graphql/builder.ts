import type { AuthScopes, Scalars } from "./types";

import { DateResolver, JSONResolver, ObjectIDResolver, GeoJSONResolver } from "graphql-scalars";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import RelayPlugin from "@pothos/plugin-relay";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import WithInputPlugin from "@pothos/plugin-with-input";
import { getTableConfig } from "drizzle-orm/pg-core";
import SchemaBuilder from "@pothos/core";
import ShieldPlugin from "./shield";
import type { YogaContext } from "graphql-yoga";

const builder = new SchemaBuilder<{
  Defaults: "v4";
  DefaultFieldNullability: false;
  Tracing: boolean | { formatMessage: (duration: number) => string };
  DrizzleRelations: DrizzleRelations;
  DrizzleTables: DrizzleTables;
  Context: YogaContext;
  Scalars: Scalars;
  AuthScopes: AuthScopes;
}>({
  defaults: "v4",
  defaultFieldNullability: false,


  // tracing: {
  //   default() {
  //     return true;
  //   },
  //   wrap(config) {
  //     return async (...params: Parameters<typeof config>) => {
  //       const [source, args, context, info] = params;
  //       const start = performance.now();
  //       const result = await config(source, args, context, info);
  //       const end = performance.now();
  //       const duration = end - start;

  //       console.log({
  //         fieldName: info.fieldName,
  //         args: JSON.stringify(args),
  //         duration,
  //       });

  //       return result;
  //     };
  //   },
  // },

  drizzle: {
    client: useDb(),
    relations: relations,
    skipDeferredFragments: true,
    defaultConnectionSize: 10,
    maxConnectionSize: 100,
    getTableConfig,
  },

  plugins: [
    DrizzlePlugin,
    ScopeAuthPlugin,
    WithInputPlugin,
    ShieldPlugin,
    RelayPlugin,
  ],

  scopeAuth: {
    authScopes: async (ctx) => {
      console.log("authScopes", ctx);

      return {
        logged:
          ctx.user !== null,
        admin:
          ctx.user?.role === "admin",
        organization:
          ctx.sessionCache?.activeOrganizationId !== null,
        organizationOwner:
          ctx.user?.role === "owner" &&
          ctx.sessionCache?.activeOrganizationId === ctx.sessionCache?.activeOrganizationId,
        organizationMember: ctx.user?.role === "member" &&
          ctx.sessionCache?.activeOrganizationId === ctx.sessionCache?.activeOrganizationId,
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
