import { eq } from 'drizzle-orm';
import type { Builder } from "../builder";

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
        logged: true,
      },
      resolve: async (_, args, context) => {
        if (!context.sessionCache) {
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
        logged: true,
      },
      resolve: async (_, args, context) => {
        if (!context.sessionCache) {
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
        logged: true,
      },
      resolve: async (_, args, context) => {
        if (!context.sessionCache) {
          throw new Error('Not authenticated or no active organization');
        }

        // Find the member ID for the current user in the active organization
        const membership = await context.db.query.members.findFirst({
          where: {
            userId: context.sessionCache.userId,
            organizationId: context.sessionCache.activeOrganizationId ?? undefined,
          },
        });
        if (!membership) {
          throw new Error('You are not a member of this organization');
        }

        // Verify the review flow exists
        const reviewFlow = await context.db.query.reviewFlows.findFirst({
          where: {
            id: args.input.reviewFlowId,
            organizationId: context.sessionCache.activeOrganizationId || 'default',
          },
        });

        if (!reviewFlow) {
          throw new Error('Review flow not found or you do not have access to it');
        }

        await context.db.insert(tables.comments).values({
          id: crypto.randomUUID(),
          formId: args.input.formFieldId ?? '',
          lastModifiedBy: membership.id,
          memberId: membership.id,
          reviewFlowId: args.input.reviewFlowId,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: args.input.content,
          formFieldId: args.input.formFieldId ?? '',
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
        logged: true,
      },
      resolve: async (_, args, context) => {
        if (!context.sessionCache) {
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
        const isOwner =
          context.member?.role === 'owner' ||
          context.user?.id === comment.memberId;

        if (!isOwner) {
          throw new Error('You are not the owner of this organization and are not authorized to delete this comment');
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
