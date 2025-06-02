import { eq } from 'drizzle-orm';

export function addCommentTypes(builder: Builder) {
  // Define Comment type
  const CommentType = builder.drizzleNode('comments', {
    name: 'Comment',
    id: { column: (comment) => comment.id },
    fields: (t) => ({
      content: t.exposeString('content'),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      member: t.relation('member'),
      reviewFlowId: t.exposeID('reviewFlowId'),
      formFieldId: t.exposeID('formFieldId', { nullable: true }),
    }),
  });

  // Input type for creating a comment
  const CreateCommentInputType = builder.inputType('CreateCommentInput', {
    fields: (t) => ({
      content: t.string({ required: true }),
      reviewFlowId: t.id({ required: true }),
      formFieldId: t.id({ required: false }),
    }),
  });

  // Query to get comments for a review flow
  const reviewFlowCommentsQuery = builder.queryField('reviewFlowComments', (t) =>
    t.field({
      type: [CommentType],
      args: {
        reviewFlowId: t.arg.string({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session) {
          throw new Error('Not authenticated');
        }

        return context.db.query.comments.findMany({
          where: {
            reviewFlowId: args.reviewFlowId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          with: {
            member: true,
            reviewFlow: true,
            formField: true,
          },
        });
      },
    })
  );

  // Query to get comments for a specific form field in a review flow
  const fieldCommentsQuery = builder.queryField('fieldComments', (t) =>
    t.field({
      type: [CommentType],
      args: {
        reviewFlowId: t.arg.id({ required: true }),
        formFieldId: t.arg.id({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session) {
          throw new Error('Not authenticated');
        }

        return context.db.query.comments.findMany({
          where: {
            reviewFlowId: args.reviewFlowId,
            formFieldId: args.formFieldId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          with: {
            member: true,
            reviewFlow: true,
            formField: true,
          },
        });
      },
    })
  );

  // Mutation to add a comment
  const addCommentMutation = builder.mutationField('addComment', (t) =>
    t.field({
      type: CommentType,
      args: {
        input: t.arg({ type: CreateCommentInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session) {
          throw new Error('Not authenticated or no active organization');
        }

        // Find the member ID for the current user in the active organization
        const membership = await context.db.query.members.findFirst({
          where: {
            userId: context.session.userId,
            organizationId: context.session.activeOrganizationId ?? undefined,
          },
        });
        if (!membership) {
          throw new Error('You are not a member of this organization');
        }

        // Verify the review flow exists
        const reviewFlow = await context.db.query.reviewFlows.findFirst({
          where: {
            id: args.input.reviewFlowId,
            organizationId: context.session.activeOrganizationId || 'default',
          },
        });

        if (!reviewFlow) {
          throw new Error('Review flow not found or you do not have access to it');
        }

        await context.db.insert(tables.comments).values({
          content: args.input.content,
          reviewFlowId: args.input.reviewFlowId,
          formFieldId: args.input.formFieldId ?? null,
          memberId: membership.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          id: crypto.randomUUID(),
        });

        const foundComment = await context.db.query.comments.findFirst({
          where: {
            id: args.input.reviewFlowId
          },
          with: {
            member: true,
            reviewFlow: true,
            formField: true,
          },
        });

        if (!foundComment) {
          throw new Error('Comment not found');
        }

        return foundComment;
      },
    })
  );

  // Mutation to delete a comment
  const deleteCommentMutation = builder.mutationField('deleteComment', (t) =>
    t.field({
      type: 'Boolean',
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session) {
          throw new Error('Not authenticated');
        }

        // Find the comment
        const comment = await context.db.query.comments.findFirst({
          where: { id: args.id as string },
        });

        if (!comment) {
          throw new Error('Comment not found');
        }

        // Check if this user is the author of the comment (by checking membership)
        const isAdmin = context.member?.role === 'admin' || context.user?.id === comment.memberId;

        if (!isAdmin) {
          throw new Error('You are not authorized to delete this comment');
        }

        // Delete the comment
        await context.db.delete(tables.comments)
          .where(eq(tables.comments.id, args.id as string));

        return true;
      },
    })
  );

  return {
    CommentType,
    CreateCommentInputType,

    reviewFlowCommentsQuery,
    fieldCommentsQuery,
    addCommentMutation,
    deleteCommentMutation,
  };
}