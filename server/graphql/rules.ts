import { rule } from "graphql-shield";
import type { YogaContext } from "graphql-yoga";
import type { GraphQLResolveInfo } from "graphql";

export const isAuthenticated = rule({ cache: 'contextual' })(
  (_parent: unknown, _args: unknown, ctx: YogaContext, _info: GraphQLResolveInfo) => !!ctx.user,
);

export const isAdmin = rule({ cache: 'contextual' })(
  (_parent: unknown, _args: unknown, ctx: YogaContext, _info: GraphQLResolveInfo) => ctx.user?.id === '1',
);