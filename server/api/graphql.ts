/* eslint-disable @typescript-eslint/no-unused-vars */

import { useSchema } from "../graphql";
import { createYoga, createPubSub, renderGraphiQL, shouldRenderGraphiQL, type YogaContext, type PubSub } from "graphql-yoga";
import type { CookieSerializeOptions } from "cookie-es";
import { initContextCache } from "@pothos/core";
import type { H3EventContext, H3Event, setCookie, deleteCookie, getCookie } from "h3";

type CookieStore = {
  get: (name: string) => string | null
  set: (name: string, value: string, options: CookieSerializeOptions) => void
  delete: (name: string, options: CookieSerializeOptions) => void
}

declare module "h3" {
  interface H3EventContext {
    db: DB
    auth: Auth
    cookies: CookieStore
  }
}

declare module "graphql-yoga" {
  interface YogaContext extends H3EventContext, SessionContainer { }
}

function createCookieStore(event: H3Event): CookieStore {
  const cookies = new Map<string, string>()
  const headers = new Headers()
  return {
    get: (name: string) => {
      return cookies.get(name) || null
    },
    set: (name: string, value: string, options: CookieSerializeOptions) => {
      cookies.set(name, value)
      headers.set("Set-Cookie", `${name}=${value}; ${Object.entries(options).map(([key, value]) => `${key}=${value}`).join("; ")}`)
    },
    delete: (name: string, options: CookieSerializeOptions) => {
      cookies.delete(name)
      headers.set("Set-Cookie", `${name}=; ${Object.entries(options).map(([key, value]) => `${key}=${value}`).join("; ")}`)
    }
  }
}

const yoga = createYoga<H3EventContext & SessionContainer, SessionContainer>({
  id: "graphql",
  schema: useSchema(),
  cors: { origin: "*", credentials: true },
  batching: { limit: 100 },
  plugins: [createPubSub()],
  graphqlEndpoint: "/api/graphql",
  context: async (ctx) => {
    const sessionContainer = await getYogaSessionData(ctx)
    if (!sessionContainer) {
      return {
        ...ctx,
        user: null as unknown as User & { banned?: boolean },
        session: null as unknown as Session,
        banned: false,
      }
    } else {
      return {
        ...ctx,
        ...sessionContainer,
      }
    }
  },
});

export default defineEventHandler(async (event) => {
  event.context.db = useDb()
  event.context.auth = useAuth()
  event.context.cookies = createCookieStore(event)

  const authContext = await event.context.auth.$context
  const generateId = () => authContext.generateId({ model: "session" })

  const { authCookies: {
    sessionData: { name: sessionDataCookieName, options: sessionDataCookieOptions },
    sessionToken: { name: sessionTokenCookieName, options: sessionTokenCookieOptions }
  } } = authContext


  const {
    clear: clearSessionFn,
    update: updateSessionFn,
    data: sessionContainerData
  } = await useSession<SessionContainer>(event, {
    name: sessionDataCookieName,
    password: 'super-strong-secret-password-string',
    cookie: {
      ...sessionDataCookieOptions,
      sameSite: sessionDataCookieOptions.sameSite as CookieSerializeOptions["sameSite"],
    },
    generateId,
  })

  if (!sessionContainerData) {
    throw new Error("Error with auth.api.getSession")
  }

  if (shouldRenderGraphiQL(toWebRequest(event))) {
    const graphiQL = renderGraphiQL({
      shouldPersistHeaders: true,
      schemaDescription: true,
      useGETForQueries: true,
      endpoint: "/api/graphql",
      credentials: "include",
      title: "GraphiQL",
      defaultQuery: `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see
# intelligent typeaheads aware of the current GraphQL type schema and
# the current GraphQL context.
#
# Expand the sections below to see introspection results and documentation for various GraphQL services.`,
    })

    return sendWebResponse(event, new Response(graphiQL, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "text/html",
      },
    }))
  }

  return sendWebResponse(event, await yoga.handleRequest(toWebRequest(event), {
    ...initContextCache(),
    ...event.context,
    user: null as unknown as User & { banned?: boolean },
    session: null as unknown as Session,
    banned: false,
  }))
})

async function getYogaSessionData(ctx: H3EventContext): Promise<SessionContainer | null> {
  const authContext = await ctx.auth.$context
  const { session: sessionData } = authContext
  if (!sessionData) {
    return null as unknown as SessionContainer
  }
  const { user, session } = sessionData
  if (!user || !session) {
    return null as unknown as SessionContainer
  }

  const sessionContainer: SessionContainer = {
    user: { ...user, banned: false, },
    session: { ...session, activeOrganizationId: session.activeOrganizationId || null },
  }

  if (session.activeOrganizationId) {
    const activeOrganizationId = session.activeOrganizationId
    const activeOrganizationResponse = await ctx.db.query.members.findFirst({
      where: {
        userId: user.id,
        organizationId: activeOrganizationId,
      },
      with: {
        organization: true
      }
    })

    if (activeOrganizationResponse) {
      const { organization, ...member } = activeOrganizationResponse
      session.activeOrganization = {
        organization,
        member,
      }
    }
  }

  return sessionContainer
}
