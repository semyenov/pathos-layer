import { createYoga } from 'graphql-yoga';
import { useSchema } from '../utils/graphql';

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
      where: {
        userId: user.id,
        organizationId: session.activeOrganizationId ?? undefined,
      }
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

export default defineNitroPlugin(({ router }) => {
  router.get('/graphql', defineEventHandler(async (event) => {
    const req = toWebRequest(event)
    return graphql.handleRequest(req, event.context as any);
  }));

  router.use('/health', defineEventHandler(() => {
    return 'OK';
  }));
});