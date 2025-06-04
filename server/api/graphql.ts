import type { ServerAdapterInitialContext, WaitUntilFn } from "@whatwg-node/server";
import { createYoga, renderGraphiQL, type YogaContext } from "graphql-yoga";
import { defineEventHandler, sendWebResponse, toWebRequest } from "h3";
import { shouldRenderGraphiQL } from "@ardatan/graphql-helix";
import type { Context } from "../graphql";
import { useSchema } from "../graphql";
import { useDb } from "../utils/db";
import { useAuth } from "../utils/auth";
import { createFetch } from "@whatwg-node/fetch";

declare module "h3" {
  interface H3EventContext extends Context, Partial<ServerAdapterInitialContext> {
    waitUntil: WaitUntilFn;
  }
}

declare module "graphql-yoga" {
  interface YogaContext extends Context, ServerAdapterInitialContext { }
}


const yoga = createYoga<Context, YogaContext>({
  schema: useSchema(),

  cors: {
    origin: "*",
    credentials: true,
  },

  batching: {
    limit: 10,
  },

  fetchAPI: createFetch({
    useNodeFetch: true,
    skipPonyfill: false,
    formDataLimits: {
      fields: 1000,
      files: 10,
      parts: 1000,
      fieldNameSize: 100,
      fileSize: 10 * 1024 * 1024,
      fieldSize: 1000,
      headerSize: 1000,
    },
  }),

  context: (ctx) => ctx,
});


export default defineEventHandler(async (event) => {
  if (shouldRenderGraphiQL(toWebRequest(event))) {
    return sendWebResponse(event,
      new Response(renderGraphiQL({
        endpoint: "/api/graphql",
        shouldPersistHeaders: true,
        credentials: "include",
      }), {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/html" },
      }),
    );
  }

  event.context = {
    event,
    waitUntil: event.context.waitUntil,

    db: useDb(),
    auth: useAuth(),

    user: null,
    member: null,
    session: null,
    organization: null,
  };

  const sessionData = await event.context.auth.api.getSession(
    toWebRequest(event),
  );

  if (sessionData) {
    event.context.session = sessionData.session;
    event.context.user = sessionData.user;

    if (sessionData.session.activeOrganizationId) {
      event.context.organization =
        (await event.context.db.query.organizations.findFirst({
          where: { id: sessionData.session.activeOrganizationId },
        })) ?? null;

      event.context.member =
        (await event.context.db.query.members.findFirst({
          where: {
            userId: event.context.user.id,
            organizationId: sessionData.session.activeOrganizationId,
          },
        })) ?? null;
    }
  }

  return sendWebResponse(event,
    await yoga.handleRequest(
      toWebRequest(event),
      event.context,
    ),
  );
});