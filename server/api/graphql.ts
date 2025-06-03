import type { ServerAdapterInitialContext } from "@whatwg-node/server";
import { useCookies } from "@whatwg-node/server-plugin-cookies";
import { createYoga, renderGraphiQL, createPubSub } from "graphql-yoga";
import { defineEventHandler, sendWebResponse, toWebRequest } from "h3";
import { shouldRenderGraphiQL, } from "@ardatan/graphql-helix";
import { createFetch } from "@whatwg-node/fetch";
import { type Context, useSchema } from "../graphql";

declare module "h3" {
  interface H3EventContext extends Context, ServerAdapterInitialContext { }
}

declare module "graphql-yoga" {
  interface YogaContext extends Context, ServerAdapterInitialContext { }
}

const graphql = createYoga({
  id: "graphql",

  graphiql: {
    title: "GraphQL Playground",
    defaultQuery: `# Welcome to GraphQL Playground!
# Type queries into this side of the screen, and you will see
# responses in this side of the screen.
#
# Try typing:
#   {
#     hello
#   }
#
# Or just press the play button.
#
# Enjoy!`,
    defaultHeaders: "Content-Type: application/json",
    credentials: "include",
    defaultEditorToolsVisibility: "variables",
    directiveIsRepeatable: true,
    inputValueDeprecation: true,
    isHeadersEditorEnabled: true,
    editorTheme: "light",
    shouldPersistHeaders: true,
    schemaDescription: true,
    commentDescriptions: true,
    experimentalFragmentVariables: true,
    useGETForQueries: true,
  },

  schema: useSchema(),

  cors: {
    origin: "*",
    credentials: true,
  },

  batching: {
    limit: 100,
  },

  fetchAPI: createFetch({
    useNodeFetch: false,
    skipPonyfill: false,
  }),

  plugins: [
    useCookies(),
    createPubSub(),
  ],

  context: async (ctx) => {
    const db = useDb();
    const auth = useAuth();
    const { cookieStore: cookies } = ctx.request;

    let user: User | null = null;
    let session: Session | null = null;
    let member: Member | null = null;
    let organization: Organization | null = null;

    const sessionData = await auth.api.getSession(ctx.request);
    if (sessionData) {
      session = sessionData.session;
      user = sessionData.user;

      const activeOrganizationId = session.activeOrganizationId;
      if (activeOrganizationId) {
        organization = await db.query.organizations.findFirst({
          where: {
            id: activeOrganizationId,
          },
        }) ?? null;

        member = await db.query.members.findFirst({
          where: {
            userId: user.id,
            organizationId: activeOrganizationId,
          },
        }) ?? null;
      }
    }

    return {
      ...ctx,

      db,
      auth,
      cookies,

      user,
      session,
      member,
      organization,
    };
  },
});


export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);
  if (shouldRenderGraphiQL(request)) {
    const graphiql = renderGraphiQL({
      endpoint: "/api/graphql",
      shouldPersistHeaders: true,
      credentials: "include",
    });

    const response = new Response(graphiql, {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/html" },
    });

    return sendWebResponse(event, response);
  }

  const response = await graphql.handleRequest(
    request,
    event.context,
  );

  return sendWebResponse(event, response);
});
