import { createYoga } from 'graphql-yoga';
import { useSchema } from '../utils/graphql';
import { sendWebResponse } from 'h3';

const schema = useSchema();

const graphql = createYoga({
  schema,
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
      };
    }

    const session = authSession.session;
    const user = authSession.user;

    const member = user?.id ? await db.query.members.findFirst({
      where: { userId: user.id, organizationId: session.activeOrganizationId ?? undefined, }
    }) : null;

    return {
      ...ctx,

      db,
      auth,

      user,
      member,
      session,
    };
  },
});

export default defineEventHandler(async (event) => {
  const { req, res } = event.node;
  const response = await graphql.handleNodeRequestAndResponse(req, res);
  return sendWebResponse(event, response);
});