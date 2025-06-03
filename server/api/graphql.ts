import type { ServerAdapterInitialContext } from "@whatwg-node/server";
import type { ExecutionResult } from "graphql";

import { createYoga, isAsyncIterable, renderGraphiQL, type GraphQLParams } from "graphql-yoga";
import { defineEventHandler, sendWebResponse, toWebRequest } from "h3";
import { shouldRenderGraphiQL, getGraphQLParameters } from "@ardatan/graphql-helix";
import { createFetch } from "@whatwg-node/fetch";

const graphql = createYoga({
  id: "graphql",

  graphqlEndpoint: "/api/graphql",
  graphiql: {
    endpoint: "/api/graphql",
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
    useNodeFetch: true,
    skipPonyfill: true,
  }),
  context: async (ctx) => {
    const db = useDb();
    const auth = useAuth();

    const authSession = await auth.api.getSession(ctx.request);
    if (!authSession) {
      return {
        ...ctx,

        db,
        auth,

        user: null,
        member: null,
        session: null,
        organization: null,
      };
    }

    const session = authSession.session;
    const user = authSession.user;
    const member = user?.id
      ? await db.query.members.findFirst({
          where: { userId: user.id, organizationId: session.activeOrganizationId ?? undefined },
        })
      : null;

    return {
      ...ctx,

      db,
      auth,

      user: user ?? null,
      member: member ?? null,
      session: session ?? null,
      organization: member?.organizationId ?? null,
    };
  },
});

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);

  if (shouldRenderGraphiQL(request)) {
    const graphiql = renderGraphiQL({
      endpoint: "/api/graphql",
    });

    const response = new Response(graphiql, request);
    response.headers.set("Content-Type", "text/html");

    return sendWebResponse(event, response);
  }

  const params = (await getGraphQLParameters(request)) as GraphQLParams;
  const context = event.context as ServerAdapterInitialContext;
  const result = await graphql.getResultForParams({ params, request }, context);

  if (isAsyncIterable(result)) {
    const { data, errors, extensions } = result as unknown as ExecutionResult;

    if (errors) {
      const response = new Response(JSON.stringify({ errors }), {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      });

      return sendWebResponse(event, response);
    }

    const response = new Response(JSON.stringify({ data, extensions }), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "application/json" },
    });

    return sendWebResponse(event, response);
  }

  const response = new Response(JSON.stringify(result), {
    status: 200,
    statusText: "OK",
    headers: { "Content-Type": "application/json" },
  });

  return sendWebResponse(event, response);
});
