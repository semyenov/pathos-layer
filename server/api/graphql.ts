import type { CookieOptions } from "better-auth";
import { createYoga, renderGraphiQL, createPubSub, type YogaContext, shouldRenderGraphiQL } from "graphql-yoga";
import { defineEventHandler, sendWebResponse, toWebRequest, getCookie, setCookie, type H3EventContext } from "h3";
import { useSchema } from "../graphql";

export interface SessionContext {
  user: User | null;
  session: Session | null;
  member: Member | null;
  organization: Organization | null;
}

interface Cookies {
  get: (name: string) => string | null;
  set: (name: string, value: string, options: CookieOptions) => void;
  delete: (name: string) => void;
}

declare module "h3" {
  interface H3EventContext {
    db: DB;
    auth: Auth;
    cookies: Cookies;
  }
}

declare module "graphql-yoga" {
  interface YogaContext extends H3EventContext, SessionContext { }
}

const graphql = createYoga<H3EventContext, YogaContext>({
  id: "graphql",

  schema: useSchema(),

  cors: {
    origin: "*",
    credentials: true,
  },

  batching: {
    limit: 100,
  },

  plugins: [
    createPubSub(),
  ],

  context: async (context) => {
    const yogaContext = await getYogaContext(context);
    console.log("yogaContext", yogaContext);
    return {
      ...context,
      ...yogaContext,
    };
  },
});

export default defineEventHandler(async (event) => {
  if (shouldRenderGraphiQL(toWebRequest(event))) {
    return sendWebResponse(event, new Response(renderGraphiQL({
      endpoint: "/api/graphql",
      shouldPersistHeaders: true,
      credentials: "include",
    }), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/html" },
    }));
  }

  event.context.db = useDb();
  event.context.auth = useAuth();
  event.context.cookies = {
    delete: (name: string) => deleteCookie(event, name),
    get: (name: string) => getCookie(event, name) ?? null,
    set: (name: string, value: string, options: CookieOptions) => setCookie(event, name, value, {
      ...options,
      sameSite: options.sameSite === "Strict"
        ? "strict"
        : options.sameSite === "Lax"
          ? "lax"
          : options.sameSite === "None"
            ? "none"
            : undefined,
    }),
  };

  return sendWebResponse(event, await graphql.handleRequest(
    toWebRequest(event), event.context
  ));
});


async function getYogaContext(context: H3EventContext): Promise<YogaContext> {
  let session: Session | null = null;
  let user: User | null = null;
  let member: Member | null = null;
  let organization: Organization | null = null;

  const sessionData = await context.auth.api.getSession({
    headers: context.request.headers,
    query: { disableCookieCache: true, disableRefresh: false },
  });

  if (sessionData) {
    session = sessionData.session;
    user = sessionData.user;

    if (user && session?.activeOrganizationId) {
      member =
        (await context.db.query.members.findFirst({
          where: {
            userId: user.id,
            organizationId: session.activeOrganizationId,
          },
        })) ?? null;

      if (member) {
        organization =
          (await context.db.query.organizations.findFirst({
            where: { id: session.activeOrganizationId },
          })) ?? null;
      }
    }
  }

  return {
    ...context,

    session,
    user,
    member,
    organization,
  };
}