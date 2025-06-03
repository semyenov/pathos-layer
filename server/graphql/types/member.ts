import { eq } from 'drizzle-orm';
import type { Builder } from '../builder';

export function addMemberTypes(builder: Builder) {
  const MemberRoleEnumType = builder.enumType('MemberRole', {
    values: {
      owner: { value: 'owner' },
      reviewer: { value: 'reviewer' },
      executor: { value: 'executor' },
      member: { value: 'member' },
    },
  });

  // Define Member type
  const MemberType = builder.drizzleNode('members', {
    name: 'Member',
    id: { column: (member) => member.id },
    fields: (t) => ({
      role: t.expose('role', { type: MemberRoleEnumType, nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date', nullable: true }),
      userId: t.exposeID('userId', { nullable: true }),
      organizationId: t.exposeID('organizationId', { nullable: true }),
      organization: t.relation('organization', { nullable: true }),
    }),
  });

  const CreateMemberInputType = builder.inputType('CreateMemberInput', {
    fields: (t) => ({
      userId: t.id({ required: true }),
      organizationId: t.id({ required: true }),
      role: t.string({ required: true }),
    }),
  });

  const createMemberMutation = builder.mutationField('createMember', (t) =>

    t.field({
      type: MemberType,
      args: {
        input: t.arg({ type: CreateMemberInputType, required: true }),
      },
      resolve: async (_, args, context) => {
        if (!context.session?.userId || !context.session?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        await context.db.insert(tables.members).values({
          id: crypto.randomUUID(),
          userId: args.input.userId,
          organizationId: args.input.organizationId,
          role: args.input.role as 'owner' | 'reviewer' | 'executor' | 'member',
          lastModifiedBy: context.session.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const foundMember = await context.db.query.members.findFirst({
          where: { userId: args.input.userId, organizationId: args.input.organizationId },
          with: { user: true, organization: true },
        });

        if (!foundMember) {
          throw new Error('Member not found');
        }

        return foundMember;
      },
    })
  );

  const UpdateMemberInputType = builder.inputType('UpdateMemberInput', {

    fields: (t) => ({
      id: t.id({ required: true }),
      role: t.string({ required: true }),
    }),
  });

  const updateMemberMutation = builder.mutationField('updateMember', (t) =>

    t.field({
      type: MemberType,
      args: {
        input: t.arg({ type: UpdateMemberInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session?.userId || !context.session?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        await context.db.update(tables.members).set({
          role: args.input.role as 'owner' | 'reviewer' | 'executor' | 'member',
        }).where(eq(tables.members.id, args.input.id));

        const foundMember = await context.db.query.members.findFirst({
          where: { id: args.input.id },
          with: { user: true, organization: true, comments: true },
        });

        if (!foundMember) {
          throw new Error('Member not found');
        }

        return foundMember;
      },
    })
  );

  const deleteMemberMutation = builder.mutationField('deleteMember', (t) =>

    t.field({
      type: 'Boolean',
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },

      resolve: async (_, args, context) => {
        if (!context.session?.userId || !context.session?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        const foundMember = await context.db.query.members.findFirst({
          where: { id: args.id },
          with: { user: true, organization: true, comments: true },
        });

        if (!foundMember) {
          await context.db
            .delete(tables.members)
            .where(eq(tables.members.id, args.id));

          return true;
        }

        return false;
      },
    })
  );

  return {
    MemberRoleEnumType,
    MemberType,
    CreateMemberInputType,
    UpdateMemberInputType,

    createMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
  };
}