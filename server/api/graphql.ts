import type { ServerAdapterInitialContext } from "@whatwg-node/server";
import { createYoga, renderGraphiQL, type YogaContext } from "graphql-yoga";
import { defineEventHandler, sendWebResponse, toWebRequest, setCookie, getCookie } from "h3";
import { shouldRenderGraphiQL } from "@ardatan/graphql-helix";
import type { Context } from "../graphql";
import { useSchema } from "../graphql";

declare module "h3" {
  interface H3EventContext extends Context, ServerAdapterInitialContext { }
}

declare module "graphql-yoga" {
  interface YogaContext
    extends Pick<Context, "db" | "auth" | "request">,
    ServerAdapterInitialContext { }
}

type SessionData = {
  session: Session | null;
  user: User | null;
  member: Member | null;
  organization: Organization | null;
};


const yoga = createYoga<Context, YogaContext>({
  schema: useSchema(),
  context: async (ctx) => {
    const { authCookies: { sessionToken: { name } } } = await useAuth().$context;
    const sessionData = await getSessionData(ctx.request.headers);

    ctx.session = sessionData?.session ?? null;
    ctx.user = sessionData?.user ?? null;
    ctx.member = sessionData?.member ?? null;
    ctx.organization = sessionData?.organization ?? null;

    return ctx;
  },
});

/**
 * Get the current session from the request context
 * @param req The request object
 * @returns The session data with user, session, member, and organization
 */
export const getSessionData = async (
  headers: Headers,
): Promise<SessionData | null> => {
  let user: User | null = null;
  let session: Session | null = null;
  let member: Member | null = null;
  let organization: Organization | null = null;

  const sessionData = await useAuth().api.getSession({
    headers,
  });

  if (
    sessionData?.session
    && sessionData?.user
  ) {
    session = sessionData.session;
    user = sessionData.user;

    const activeOrganizationId = session.activeOrganizationId;
    if (activeOrganizationId) {
      organization =
        (await useDb().query.organizations.findFirst({
          where: { id: activeOrganizationId },
        })) ?? null;

      member =
        (await useDb().query.members.findFirst({
          where: { userId: user.id, organizationId: activeOrganizationId },
        })) ?? null;
    }
  }

  return {
    user,
    session,
    member,
    organization,
  };
};

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);

  const headers = request.headers;
  const { authCookies: { sessionToken: { name } } } = await useAuth().$context;

  const sessionToken = getCookie(event, name) ?? null;
  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`);
  }

  if (shouldRenderGraphiQL(request)) {
    const graphiql = renderGraphiQL({
      endpoint: "/api/graphql",
      shouldPersistHeaders: true,
      credentials: "include",
    });

    return sendWebResponse(event, new Response(graphiql, {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/html" },
    }));
  }

  // Set the database and authentication client in the context
  event.context.db = useDb();
  event.context.auth = useAuth();
  event.context.request = request;

  const sessionData = await getSessionData(headers);
  if (
    sessionData?.session
    && sessionData?.user
  ) {
    event.context.session = sessionData.session;
    event.context.user = sessionData.user;
    event.context.member = sessionData.member ?? null;
    event.context.organization = sessionData.organization ?? null;
  }

  if (sessionData?.session && sessionData.session.token) {
    setCookie(event, name, sessionData.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
      path: "/",
      domain: process.env.NODE_ENV === "production" ? "formflow.ai" : "localhost",
    });
  }

  // Handle the request
  const response = await yoga.handle(request, event.context);
  return sendWebResponse(event, response);
});
