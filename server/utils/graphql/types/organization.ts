import { eq } from 'drizzle-orm';

export function addOrganizationTypes(builder: Builder) {
  // Define Organization type
  const OrganizationType = builder.drizzleNode('organizations', {
    name: 'Organization',
    id: { column: (organization) => organization.id },
    fields: (t) => ({
      name: t.exposeString('name'),
      slug: t.exposeString('slug', { nullable: true }),
      logo: t.exposeString('logo', { nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      members: t.relation('members', { nullable: true }),
    }),
  });

  // Input type for creating an organization
  const CreateOrganizationInputType = builder.inputType('CreateOrganizationInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      slug: t.string({ required: false }),
      logo: t.string({ required: false }),
    }),
  });

  // Input type for updating an organization
  const UpdateOrganizationInputType = builder.inputType('UpdateOrganizationInput', {
    fields: (t) => ({
      name: t.string({ required: false }),
      slug: t.string({ required: false }),
      logo: t.string({ required: false }),
    }),
  });

  // Input type for inviting a member
  const InviteMemberInputType = builder.inputType('InviteMemberInput', {
    fields: (t) => ({
      email: t.string({ required: true }),
      role: t.string({ required: true }),
      organizationId: t.id({ required: true }),
    }),
  });

  // Query to get all organizations for the current user
  const organizationsQuery = builder.queryField('organizations', (t) =>
    t.field({
      type: [OrganizationType],
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, { member: user, db }) => {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Get all members for the current user
        const members = await db.query.members.findMany({
          where: { userId: user.id },
        });

        // Get all organizations for those members
        const organizationIds = members.map((member: { organizationId: string }) => member.organizationId);
        if (organizationIds.length === 0) {
          return [];
        }

        return db.query.organizations.findMany({
          where: { id: { in: organizationIds } },
          with: { members: true, forms: true, invitations: true, reviewFlows: true },
        });
      },
    })
  );

  // Query to get a single organization by ID
  const organizationQuery = builder.queryField('organization', (t) =>
    t.field({
      type: OrganizationType,
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, { member: user, db }) => {
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Check if user is a member of this organization
        const member = await db.query.members.findFirst({
          where: {
            userId: user.id,
            organizationId: args.id,
          },
        });

        if (!member) {
          throw new Error('Not a member of this organization');
        }

        const organization = await db.query.organizations.findFirst({
          where: { id: args.id },
          with: { members: true, forms: true, invitations: true, reviewFlows: true },
        });

        if (!organization) {
          throw new Error('Organization not found');
        }

        return organization;
      },
    })
  );

  // Mutation to create an organization
  const createOrganizationMutation = builder.mutationField('createOrganization', (t) =>
    t.field({
      type: OrganizationType,
      args: {
        input: t.arg({ type: CreateOrganizationInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, { member: user, db }) => {
        if (!user) {
          throw new Error('Not authenticated');
        }

        const organizationId = crypto.randomUUID();

        // Create the organization
        await db.insert(tables.organizations).values({
          id: organizationId,
          name: args.input.name,
          slug: args.input.slug || 'default-slug',
          logo: args.input.logo || 'default-logo',
          createdAt: new Date(),
          metadata: JSON.stringify({}),
        });

        // Return the created organization
        const newOrganization = await db.query.organizations.findFirst({
          where: { id: organizationId },
          with: { members: true, forms: true, invitations: true, reviewFlows: true },
        });

        if (!newOrganization) {
          throw new Error('Failed to create organization');
        }

        // Add the current user as an owner
        const memberId = crypto.randomUUID();

        await db
          .insert(tables.members)
          .values({
            id: memberId,
            userId: user.id,
            organizationId: organizationId,
            role: 'owner',
            createdAt: new Date(),
            lastModifiedBy: user.id,
            version: 1,
          });

        return newOrganization;
      },
    })
  );

  // Mutation to update an organization
  const updateOrganizationMutation = builder.mutationField('updateOrganization', (t) =>
    t.field({
      type: OrganizationType,
      args: {
        id: t.arg.id({ required: true }),
        input: t.arg({ type: UpdateOrganizationInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.member) {
          throw new Error('Not authenticated');
        }

        // Check if user is an owner of this organization
        const member = await context.db.query.members.findFirst({
          where: {
            userId: context.member.id,
            organizationId: args.id,
            role: 'owner',
          },
        });

        if (!member) {
          throw new Error('Not authorized to update this organization');
        }

        // Update the organization
        await context.db
          .update(tables.organizations)
          .set({
            name: args.input.name || 'default-name',
            slug: args.input.slug || 'default-slug',
            logo: args.input.logo || 'default-logo',
            updatedAt: new Date(),
          })
          .where(eq(tables.organizations.id, args.id as string))
          .returning();

        const foundOrganization = await context.db.query.organizations.findFirst({
          where: { id: args.id },
          with: { members: true, forms: true, invitations: true, reviewFlows: true },
        });

        if (!foundOrganization) {
          throw new Error('Organization not found');
        }

        return foundOrganization;
      },
    })
  );

  // Mutation to invite a new member
  const inviteMemberMutation = builder.mutationField('inviteMember', (t) =>
    t.field({
      type: 'Boolean',
      args: {
        input: t.arg({ type: InviteMemberInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.member) {
          throw new Error('Not authenticated');
        }

        // Check if user is an owner or admin of this organization
        const member = await context.db.query.members.findFirst({
          where: {
            userId: context.member.id,
            organizationId: args.input.organizationId,
            role: 'owner',
          },
        });

        if (!member && context.member.role !== 'owner') {
          throw new Error('Not authorized to invite members to this organization');
        }

        const invitationId = crypto.randomUUID();

        // Create the invitation (expires in 7 days)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);

        await context.db.insert(tables.invitations).values({
          id: invitationId,
          email: args.input.email,
          organizationId: args.input.organizationId,
          inviterId: context.member.id,
          role: args.input.role as 'owner' | 'reviewer' | 'executor' | 'member',
          status: 'pending',
          expiresAt: expirationDate,
        });

        return true;
      },
    })
  );

  return {
    OrganizationType,
    CreateOrganizationInputType,
    UpdateOrganizationInputType,
    InviteMemberInputType,

    organizationsQuery,
    organizationQuery,
    createOrganizationMutation,
    updateOrganizationMutation,
    inviteMemberMutation,
  };
}
