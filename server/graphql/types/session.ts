import { eq } from 'drizzle-orm';
import type { Builder } from '../builder';

export function addSessionTypes(builder: Builder) {
  const SessionType = builder.drizzleNode('sessions', {
    name: 'Session',
    id: { column: (session) => session.id },
    description: 'A session is a user\'s session on the platform.',
    fields: (t) => ({
      userId: t.exposeID('userId'),
      activeOrganizationId: t.exposeID('activeOrganizationId', { nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      expiresAt: t.expose('expiresAt', { type: 'Date' }),
      impersonatedBy: t.exposeID('impersonatedBy', { nullable: true }),
      ipAddress: t.exposeString('ipAddress', { nullable: true }),
      token: t.exposeString('token', { nullable: true }),
      updatedAt: t.expose('updatedAt', { type: 'Date' }),
      userAgent: t.exposeString('userAgent', { nullable: true }),
    }),
  });

  // Add session query to get the current user's session
  const sessionQuery = builder.queryField('session', (t) =>
    t.field({
      type: SessionType,
      description: 'Get the current user\'s session.',
      resolve: async (_, __, { db, sessionCache: session }) => {
        if (!session?.userId) {
          throw new Error('User not authenticated');
        }

        const foundSession = await db.query.sessions.findFirst({
          where: { userId: session.userId },
          orderBy: { expiresAt: 'desc' },
          with: { user: true },
        });

        if (!foundSession) {
          throw new Error('Session not found');
        }

        return foundSession;
      },
    })
  );

  // Add mutation to set active organization
  const setActiveOrganizationMutation = builder.mutationField('setActiveOrganization', (t) =>
    t.boolean({
      description: 'Set the active organization for the current user.',
      args: {
        organizationId: t.arg.id({ required: true }),
      },
      authScopes: {
        logged: true,
      },
      resolve: async (_, args, { db, sessionCache: session }) => {
        if (!session?.userId) {
          throw new Error('User not authenticated');
        }

        // Verify the user is a member of this organization
        const membership = await db.query.members.findFirst({
          where: {
            userId: session.userId,
            organizationId: args.organizationId,
          },
        });

        if (!membership) {
          throw new Error('User is not a member of this organization');
        }

        // Update the active organization in the session
        await db.update(tables.sessions)
          .set({ activeOrganizationId: args.organizationId })
          .where(eq(tables.sessions.id, session.id));

        return true;
      },
    })
  );

  return {
    SessionType,

    sessionQuery,
    setActiveOrganizationMutation,
  };
}
