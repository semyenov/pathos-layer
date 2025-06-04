import { eq } from 'drizzle-orm';
import type { Builder } from '../builder';

export function addReviewFlowTypes(builder: Builder) {
  const reviewFlowStatusEnum = builder.enumType('ReviewFlowStatus', {
    values: {
      open: { value: 'open' },
      closed: { value: 'closed' },
    },
  });

  // Define ReviewFlow type
  const ReviewFlowType = builder.drizzleNode('reviewFlows', {
    name: 'ReviewFlow',
    id: { column: (flow) => flow.id },
    fields: (t) => ({
      status: t.expose('status', { type: reviewFlowStatusEnum }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      updatedAt: t.expose('updatedAt', { type: 'Date' }),
      version: t.exposeInt('version'),
      formId: t.exposeID('formId'),
      organizationId: t.exposeID('organizationId'),
      lastModifiedBy: t.exposeID('lastModifiedBy', { nullable: true }),
      form: t.relation('form', { nullable: true }),
      comments: t.relation('comments', { nullable: true }),
    }),
  });

  // Input type for creating a review flow
  const CreateReviewFlowInput = builder.inputType('CreateReviewFlowInput', {
    fields: (t) => ({
      formId: t.id({ required: true }),
    }),
  });

  // Input type for updating a review flow
  const UpdateReviewFlowInput = builder.inputType('UpdateReviewFlowInput', {
    fields: (t) => ({
      status: t.field({ type: reviewFlowStatusEnum, required: false }),
    }),
  });

  // Query to get review flows for an organization
  const organizationReviewFlowsQuery = builder.queryField('organizationReviewFlows', (t) =>
    t.field({
      type: [ReviewFlowType],
      args: {
        organizationId: t.arg.id({ required: true }),
        status: t.arg({ type: reviewFlowStatusEnum, required: false }),
      },
      authScopes: {
        logged: true,
      },
      resolve: async (_, args, { db, member: user }) => {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Check if user is a member of this organization
        const member = await db.query.members.findFirst({
          where: {
            userId: user.id,
            organizationId: args.organizationId,
          },
        });

        if (!member && user.role !== 'owner') {
          throw new Error('Not a member of this organization');
        }

        // Build query
        const query = db.query.reviewFlows.findMany({
          columns: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            version: true,
            formId: true,
            organizationId: true,
            lastModifiedBy: true,
          },
          where: {
            organizationId: args.organizationId,
            status: args.status || undefined,
          },
          orderBy: {
            createdAt: 'asc',
          },
          with: {
            comments: {
              orderBy: {
                createdAt: 'asc',
              },
            },
            form: true,
            organization: true,
          },
        });

        return query;
      },
    })
  );

  // Query to get a single review flow by ID
  const reviewFlowQuery = builder.queryField('reviewFlow', (t) =>
    t.field({
      type: ReviewFlowType,
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: {
        logged: true,
      },
      resolve: async (_, args, { db, member: user }) => {
        if (!user) {
          throw new Error('Not authenticated');
        }

        const reviewFlow = await db.query.reviewFlows.findFirst({
          where: { id: args.id },
          with: {
            comments: {
              orderBy: {
                createdAt: 'asc',
              },
            },
            form: true,
            organization: true,
          },
        });

        if (!reviewFlow) {
          throw new Error('Review flow not found');
        }

        // Check if user is a member of this organization
        const member = await db.query.members.findFirst({
          where: {
            userId: user.id,
            organizationId: reviewFlow.organizationId,
          },
        });

        if (!member && user.role !== 'owner') {
          throw new Error('Not authorized to view this review flow');
        }

        return reviewFlow;
      },
    })
  );

  // Query to get review flows for a form
  const formReviewFlowsQuery = builder.queryField('formReviewFlows', (t) =>
    t.field({
      type: [ReviewFlowType],
      args: {
        formId: t.arg.id({ required: true }),
      },
      authScopes: {
        logged: true,
      },
      resolve: async (_, args, { db, member: user }) => {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Get form to check organization
        const form = await db.query.forms.findFirst({
          where: { id: args.formId },
        });

        if (!form) {
          throw new Error('Form not found');
        }

        // Check if user is a member of this organization
        const member = await db.query.members.findFirst({
          where: {
            userId: user.id,
            organizationId: form.organizationId,
          },
        });

        if (!member && user.role !== 'owner') {
          throw new Error('Not authorized to view review flows for this form');
        }

        const query = db.query.reviewFlows.findMany({
          where: { formId: args.formId },
          orderBy: { createdAt: 'asc' },
          with: {
            comments: {
              orderBy: {
                createdAt: 'asc',
              },
            },
            form: true,
            organization: true,
          },
        });

        return query;
      },
    })
  );

  // Mutation to create a review flow
  const createReviewFlowMutation = builder.mutationField('createReviewFlow', (t) =>
    t.field({
      type: ReviewFlowType,
      args: {
        input: t.arg({ type: CreateReviewFlowInput, required: true }),
      },
      authScopes: {
        logged: true,
      },
      resolve: async (_, args, context) => {
        if (!context.sessionCache?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        // Get form to check organization
        const form = await context.db.query.forms.findFirst({
          where: { id: args.input.formId as string },
        });

        if (!form) {
          throw new Error('Form not found');
        }

        // Check if form belongs to the active organization
        if (form.organizationId !== context.sessionCache.activeOrganizationId) {
          throw new Error('Form does not belong to your active organization');
        }

        // Check if user is a reviewer or owner in this organization
        const member = await context.db.query.members.findFirst({
          where: {
            userId: context.member?.id,
            organizationId: context.sessionCache.activeOrganizationId,
          },
        });

        if (!member) {
          throw new Error('You are not a member of this organization');
        }

        if (member.role !== 'reviewer' && member.role !== 'owner' && context.member?.role !== 'owner') {
          throw new Error('You do not have permission to create review flows');
        }

        // Create the review flow
        const reviewFlowId = crypto.randomUUID();

        const reviewFlowData = {
          id: reviewFlowId,
          formId: args.input.formId as string,
          organizationId: context.sessionCache.activeOrganizationId,
          status: 'open' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: context.user?.id as string,
          version: 1,
        };

        await context.db
          .insert(tables.reviewFlows)
          .values(reviewFlowData)
          .returning();

        const foundReviewFlow = await context.db.query.reviewFlows.findFirst({
          where: { id: reviewFlowId },
          with: {
            comments: {
              orderBy: {
                createdAt: 'asc',
              },
            },
            form: true,
            organization: true,
          },
        });

        if (!foundReviewFlow) {
          throw new Error('Failed to create review flow');
        }

        return foundReviewFlow;
      },
    })
  );

  // Mutation to update a review flow
  const updateReviewFlowMutation = builder.mutationField('updateReviewFlow', (t) =>
    t.field({
      type: ReviewFlowType,
      args: {
        id: t.arg.id({ required: true }),
        input: t.arg({ type: UpdateReviewFlowInput, required: true }),
      },
      authScopes: {
        logged: true,
      },
      resolve: async (_, args, context) => {
        if (!context.member) {
          throw new Error('Not authenticated');
        }

        // Find the review flow
        const reviewFlow = await context.db.query.reviewFlows.findFirst({
          where: { id: args.id },
        });

        if (!reviewFlow) {
          throw new Error('Review flow not found');
        }

        // Check if user is a reviewer or owner in this organization
        const member = await context.db.query.members.findFirst({
          where: {
            userId: context.member.id,
            organizationId: reviewFlow.organizationId,
          },
        });

        if (!member && context.member.role !== 'owner') {
          throw new Error('Not authorized to update this review flow');
        }

        if (member && member.role !== 'reviewer' && member.role !== 'owner' && context.member.role !== 'owner') {
          throw new Error('You do not have permission to update review flows');
        }

        // Update the review flow
        const updateValues: Record<string, string | number | Date | null> = {
          updatedAt: new Date(),
          lastModifiedBy: member ? member.id : context.member.id,
          version: reviewFlow.version + 1,
        };

        if (args.input.status) {
          updateValues.status = args.input.status;
        }

        await context.db.update(tables.reviewFlows)
          .set(updateValues)
          .where(eq(tables.reviewFlows.id, args.id as string));

        // Return the updated review flow
        const foundReviewFlow = await context.db.query.reviewFlows.findFirst({
          where: { id: args.id },
        });

        if (!foundReviewFlow) {
          throw new Error('Failed to update review flow');
        }

        return foundReviewFlow;
      },
    })
  );

  return {
    reviewFlowStatusEnum,
    ReviewFlowType,
    CreateReviewFlowInput,
    UpdateReviewFlowInput,

    organizationReviewFlowsQuery,
    reviewFlowQuery,
    formReviewFlowsQuery,
    createReviewFlowMutation,
    updateReviewFlowMutation,
  };
}
