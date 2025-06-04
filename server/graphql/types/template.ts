import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { Builder } from '../builder';

export function addTemplateTypes(builder: Builder) {
  const TemplateFieldTypeEnumType = builder.enumType('TemplateFieldTypeEnum', {
    values: {
      text: { value: 'text' },
      textarea: { value: 'textarea' },
      number: { value: 'number' },
      date: { value: 'date' },
      select: { value: 'select' },
      checkbox: { value: 'checkbox' },
      radio: { value: 'radio' },
      file: { value: 'file' },
    },
  });

  // Define TemplateField type
  const TemplateFieldType = builder.drizzleNode('templateFields', {
    name: 'TemplateField',
    id: { column: (templateField) => templateField.id },
    fields: (t) => ({
      name: t.exposeString('name'),
      type: t.expose('type', { type: TemplateFieldTypeEnumType }),
      required: t.expose('required', { type: 'Boolean' }),
      order: t.expose('order', { type: 'Int' }),
      options: t.expose('options', { type: 'String', nullable: true }),
      defaultValue: t.expose('defaultValue', { type: 'String', nullable: true }),
      validationRules: t.expose('validationRules', { type: 'String', nullable: true }),
    }),
  });

  // Define Template type
  const TemplateType = builder.drizzleNode('templates', {
    name: 'Template',
    id: { column: (template) => template.id },
    fields: (t) => ({
      name: t.exposeString('name'),
      description: t.expose('description', { type: 'String', nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      updatedAt: t.expose('updatedAt', { type: 'Date' }),
      version: t.expose('version', { type: 'Int' }),
      fields: t.field({
        type: [TemplateFieldType],
        resolve: async (template, _, context) => {
          return context.db.query.templateFields.findMany({
            where: { templateId: template.id },
            orderBy: { order: 'asc' },
            with: { template: true, formFields: true },
          });
        },
      })
    }),
  });

  // Input type for creating/updating template fields
  const TemplateFieldInput = builder.inputType('TemplateFieldInput', {
    fields: (t) => ({
      id: t.string({ required: false }),
      name: t.string({ required: true }),
      type: t.field({ type: TemplateFieldTypeEnumType, required: true }),
      required: t.boolean({ required: true }),
      order: t.int({ required: true }),
      options: t.string({ required: false }),
      defaultValue: t.string({ required: false }),
      validationRules: t.string({ required: false }),
    }),
  });

  // Input type for creating a form template
  const CreateTemplateInput = builder.inputType('CreateTemplateInput', {
    fields: (t) => ({
      name: t.string({ required: true }),
      description: t.string({ required: false }),
      fields: t.field({ type: [TemplateFieldInput], required: true }),
    }),
  });

  // Input type for updating a form template
  const UpdateTemplateInput = builder.inputType('UpdateTemplateInput', {
    fields: (t) => ({
      name: t.string({ required: false, defaultValue: null }),
      description: t.string({ required: false, defaultValue: null }),
      fields: t.field({ type: [TemplateFieldInput], required: false }),
    }),
  });

  const FormFieldTypeEnumType = builder.enumType('FormFieldTypeEnum', {
    values: {
      text: { value: 'text' },
      textarea: { value: 'textarea' },
      number: { value: 'number' },
      date: { value: 'date' },
      select: { value: 'select' },
      checkbox: { value: 'checkbox' },
      radio: { value: 'radio' },
      file: { value: 'file' },
    },
  });

  const FormStatusEnumType = builder.enumType('FormStatus', {
    values: {
      draft: { value: 'draft' },
      underReview: { value: 'underReview' },
      needsChanges: { value: 'needsChanges' },
      approved: { value: 'approved' },
      rejected: { value: 'rejected' },
    },
  });

  const FormFieldStatusEnumType = builder.enumType('FormFieldStatus', {
    values: {
      draft: { value: 'draft' },
      rejected: { value: 'rejected' },
      approved: { value: 'approved' },
    },
  });

  // Define FormField type
  const FormFieldType = builder.drizzleNode('formFields', {
    name: 'FormField',
    id: { column: (formField) => formField.id },
    fields: (t) => ({
      name: t.exposeString('name'),
      type: t.expose('type', { type: FormFieldTypeEnumType }),
      required: t.exposeBoolean('required'),
      order: t.exposeInt('order'),
      options: t.exposeString('options', { nullable: true }),
      value: t.exposeString('value', { nullable: true }),
      status: t.expose('status', { type: FormFieldStatusEnumType }),
      templateFieldId: t.exposeID('templateFieldId', { nullable: true }),
      templateField: t.field({
        type: TemplateFieldType,
        nullable: true,
        resolve: async (formField, _, { db }) => {
          if (!formField.templateFieldId) return null;
          const templateField = await db.query.templateFields.findFirst({
            where: { id: formField.templateFieldId },
            with: { template: true, formFields: true },
          });
          return templateField;
        },
      }),
    }),
  });

  // Define Form type
  const FormType = builder.drizzleNode('forms', {
    name: 'Form',
    id: { column: (form) => form.id },
    fields: (t) => ({
      title: t.exposeString('title', { nullable: true }),
      description: t.exposeString('description', { nullable: true }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      updatedAt: t.expose('updatedAt', { type: 'Date' }),
      status: t.expose('status', { type: FormStatusEnumType }),
      version: t.exposeInt('version', { nullable: true }),
      template: t.field({
        type: TemplateType,
        nullable: true,
        resolve: async (form, __, { db }) => {
          if (!form.templateId) return null;
          const template = await db.query.templates.findFirst({
            where: { id: form.templateId },
            with: { fields: true },
          });
          return template;
        },
      }),
      fields: t.field({
        type: [FormFieldType],
        resolve: async (form, __, { db }) => {
          const formFields = await db.query.formFields.findMany({
            where: { formId: form.id },
            orderBy: { order: 'asc' },
            with: { templateField: true, form: true, comments: true },
          });
          return formFields;
        },
      }),
    }),
  });

  // Input type for creating/updating form fields
  const FormFieldInputType = builder.inputType('FormFieldInput', {
    fields: (t) => ({
      id: t.id({ required: false }),
      name: t.string({ required: true }),
      type: t.field({ type: FormFieldTypeEnumType, required: true }),
      required: t.boolean({ required: true }),
      order: t.int({ required: true }),
      options: t.string({ required: false }),
    }),
  });

  // Input type for creating a form
  const CreateFormInputType = builder.inputType('CreateFormInput', {
    fields: (t) => ({
      title: t.string({ required: true }),
      description: t.string({ required: false }),
      fields: t.field({ type: [FormFieldInputType], required: true }),
      templateId: t.id({ required: true }),
    }),
  });

  // Input type for creating a form from template
  const CreateFormFromTemplateInputType = builder.inputType('CreateFormFromTemplateInput', {
    fields: (t) => ({
      title: t.string({ required: true }),
      description: t.string({ required: false }),
      templateId: t.id({ required: true }),
    }),
  });

  // Query to get all forms for the current user's organization
  const formsQuery = builder.queryField('forms', (t) =>
    t.field({
      type: [FormType],
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, context) => {
        if (!context.session?.activeOrganizationId || context.session.activeOrganizationId === 'default') {
          throw new Error('No active organization');
        }

        return context.db.query.forms.findMany({
          where: { organizationId: context.session.activeOrganizationId },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });
      },
    })
  );

  // Query to get a single form by ID
  const formQuery = builder.queryField('form', (t) =>
    t.field({
      type: FormType,
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        const form = await context.db.query.forms.findFirst({
          where: { id: args.id },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });

        if (!form) {
          throw new Error('Form not found');
        }

        return form;
      },
    })
  );

  // Mutation to create a form
  const createFormMutation = builder.mutationField('createForm', (t) =>
    t.field({
      type: FormType,
      args: {
        input: t.arg({ type: CreateFormInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session?.userId || !context.session?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        if (!context.member) {
          throw new Error('No member found');
        }

        const template = await context.db.query.templates.findFirst({
          where: { id: args.input.templateId },
          with: { fields: true },
        });

        if (!template) {
          throw new Error('Template not found');
        }

        if (template.fields.length === 0) {
          throw new Error('Template has no fields');
        }

        const formId = randomUUID();

        // Create the form
        await context.db.insert(tables.forms).values({
          id: formId,
          title: args.input.title,
          description: args.input.description || null,
          creatorMemberId: context.member.id,
          organizationId: context.session.activeOrganizationId || 'default',
          status: 'draft' as const,
          updatedAt: new Date(),
          templateId: args.input.templateId,
          lastModifiedBy: context.user?.id ?? 'default' as string,
          executorMemberId: context.member?.id ?? 'default' as string,
          createdAt: new Date(),
        });

        // Create the form fields
        if (args.input.fields.length > 0) {
          await context.db.insert(tables.formFields).values(
            (
              args.input.fields.map(
                templateField => ({
                  id: randomUUID(),
                  lastModifiedBy: context.user?.id ?? 'default' as string,
                  executorMemberId: context.member?.id ?? 'default' as string,
                  executorMember: context.member ?? null,
                  templateFieldId: templateField.id ?? 'default' as string,
                  formId: formId,
                  name: templateField.name,
                  type: templateField.type,
                  required: templateField.required,
                  order: templateField.order,
                  options: templateField.options || null,
                  status: 'draft' as const,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }))
            ))
        }

        // Return the created form
        const newForm = await context.db.query.forms.findFirst({
          where: { id: formId },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });

        if (!newForm) {
          throw new Error('Failed to create form');
        }

        return newForm;
      },
    })
  );

  // Mutation to create a form from a template
  const createFormFromTemplateMutation = builder.mutationField('createFormFromTemplate', (t) =>
    t.field({
      type: FormType,
      args: {
        input: t.arg({ type: CreateFormFromTemplateInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session?.userId || !context.session?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        if (!context.member) {
          throw new Error('No member found');
        }

        // Get the template with its fields
        const template = await context.db.query.templates.findFirst({
          where: { id: args.input.templateId },
          with: { fields: true },
        });

        if (!template) {
          throw new Error('Template not found');
        }

        const formId = randomUUID();

        // Create the form
        await context.db.insert(tables.forms).values({
          id: formId,
          title: args.input.title,
          description: args.input.description || template.description || null,
          creatorMemberId: context.member.id,
          organizationId: context.session.activeOrganizationId || 'default',
          templateId: args.input.templateId,
          status: 'draft' as const,
          updatedAt: new Date(),
          lastModifiedBy: context.user?.id ?? 'default' as string,
          executorMemberId: context.member?.id ?? 'default' as string,
        });

        // Create the form fields from template fields
        if (template.fields && template.fields.length > 0) {
          await context.db.insert(tables.formFields).values(
            template.fields.map((templateField) => ({
              id: randomUUID(),
              lastModifiedBy: context.user?.id ?? 'default' as string,
              executorMemberId: context.member?.id ?? 'default' as string,
              formId: formId,
              name: templateField.name,
              type: templateField.type as unknown as 'number' | 'date' | 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file',
              required: templateField.required,
              order: templateField.order,
              options: templateField.options || null,
              value: templateField.defaultValue || null,
              status: 'draft' as const,
              templateFieldId: templateField.id, // Link to the template field
            }))
          );
        }

        // Return the created form
        const newForm = await context.db.query.forms.findFirst({
          where: { id: formId },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });

        if (!newForm) {
          throw new Error('Failed to create form from template');
        }

        return newForm;
      },
    })
  );

  // Input type for updating a form
  const UpdateFormInputType = builder.inputType('UpdateFormInput', {
    fields: (t) => ({
      id: t.id({ required: true }),
      title: t.string({ required: true }),
      description: t.string({ required: false }),
    }),
  });

  // Mutation to update a form
  const updateFormMutation = builder.mutationField('updateForm', (t) =>
    t.field({
      type: FormType,
      args: {
        input: t.arg({ type: UpdateFormInputType, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session?.userId || !context.session?.activeOrganizationId) {
          throw new Error('Not authenticated or no active organization');
        }

        const form = await context.db.query.forms.findFirst({
          where: { id: args.input.id },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });

        if (!form) {
          throw new Error('Form not found');
        }

        await context.db.update(tables.forms).set({
          title: args.input.title,
          description: args.input.description || null,
          updatedAt: new Date(),
        }).where(eq(tables.forms.id, args.input.id));

        const foundForm = await context.db.query.forms.findFirst({
          where: { id: args.input.id },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });

        if (!foundForm) {
          throw new Error('Form not found');
        }

        return foundForm;
      },
    })
  );

  // Mutation to delete a form
  const deleteFormMutation = builder.mutationField('deleteForm', (t) =>
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

        const form = await context.db.query.forms.findFirst({
          where: { id: args.id },
          with: { fields: true, template: true, organization: true, history: true, reviewFlow: true },
        });

        if (!form) {
          throw new Error('Form not found');
        }

        await context.db.delete(tables.forms).where(eq(tables.forms.id, args.id));

        return true;
      },
    })
  );

  // Query to get all form templates
  const templatesQuery = builder.queryField('templates', (t) =>
    t.field({
      type: [TemplateType],
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, __, context) => {
        return context.db.query.templates.findMany({
          orderBy: { name: 'asc' },
          with: { fields: true, forms: true },
        });
      },
    })
  );

  // Query to get a single form template by ID
  const templateQuery = builder.queryField('template', (t) =>
    t.field({
      type: TemplateType,
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        const template = await context.db.query.templates.findFirst({
          where: { id: args.id },
          with: { fields: true, forms: true },
        });

        if (!template) {
          throw new Error('Form template not found');
        }

        return template;
      },
    })
  );

  // Mutation to create a form template
  const createTemplateMutation = builder.mutationField('createTemplate', (t) =>
    t.field({
      type: TemplateType,
      args: {
        input: t.arg({ type: CreateTemplateInput, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session) {
          throw new Error('Not authenticated');
        }

        const templateId = randomUUID();

        // Create the form template
        await context.db.insert(tables.templates).values({
          id: templateId,
          name: args.input.name,
          description: args.input.description || null,
          lastModifiedBy: context.user?.id ?? 'default' as string,
          creatorMemberId: context.member?.id ?? 'default' as string,
          organizationId: context.session?.activeOrganizationId || 'default',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Create the form template fields
        if (args.input.fields.length > 0) {
          await context.db.insert(tables.templateFields).values(
            args.input.fields.map(field => ({
              id: randomUUID(),
              templateId: templateId,
              name: field.name,
              type: field.type,
              required: field.required,
              order: field.order,
              options: field.options || null,
              defaultValue: field.defaultValue || null,
              validationRules: field.validationRules || null,
              lastModifiedBy: context.user?.id ?? 'default' as string,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          );
        }

        // Return the created template
        const newTemplate = await context.db.query.templates.findFirst({
          where: { id: templateId },
          with: { fields: true, forms: true },
        });

        if (!newTemplate) {
          throw new Error('Failed to create form template');
        }

        return newTemplate;
      },
    })
  );

  // Mutation to update a form template
  const updateTemplateMutation = builder.mutationField('updateTemplate', (t) =>
    t.field({
      type: TemplateType,

      args: {
        id: t.arg.id({ required: true }),
        input: t.arg({ type: UpdateTemplateInput, required: true }),
      },
      authScopes: {
        loggedIn: true,
      },
      resolve: async (_, args, context) => {
        if (!context.session) {
          throw new Error('Not authenticated');
        }

        // Check if template exists
        const template = await context.db.query.templates.findFirst({
          where: { id: args.id },
          with: { fields: true },
        });

        if (!template) {
          throw new Error('Form template not found');
        }

        // Update template basic info
        const updatedTemplate = await context.db.update(tables.templates)
          .set({
            lastModifiedBy: context.user?.id ?? 'default' as string,
            updatedAt: new Date(),
            version: template.version + 1,
            name: args.input.name || template.name,
            description: args.input.description || template.description,
          })
          .where(eq(tables.templates.id, args.id as string))
          .returning();

        if (!updatedTemplate) {
          throw new Error('Failed to update form template');
        }

        // Update fields if provided
        if (args.input.fields && args.input.fields.length > 0) {
          // Delete existing fields
          await context.db.delete(tables.templateFields)
            .where(eq(tables.templateFields.templateId, args.id as string));

          // Add new fields
          await context.db.insert(tables.templateFields).values(
            args.input.fields.map(field => ({
              id: randomUUID(),
              templateId: args.id,
              name: field.name,
              type: field.type,
              required: field.required,
              order: field.order,
              options: field.options || null,
              defaultValue: field.defaultValue || null,
              validationRules: field.validationRules || null,
              lastModifiedBy: context.user?.id ?? 'default' as string,
            }))
          );
        }

        // Return the updated template
        const foundTemplate = await context.db.query.templates.findFirst({
          where: { id: args.id },
          with: { fields: true, forms: true },
          orderBy: { name: 'asc' },
        });

        if (!foundTemplate) {
          throw new Error('Failed to update form template');
        }

        return foundTemplate;
      },
    })
  );

  // Mutation to delete a form template
  const deleteTemplateMutation = builder.mutationField('deleteTemplate', (t) =>
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

        // Check if template exists
        const template = await context.db.query.templates.findFirst({
          where: { id: args.id, organizationId: context.session.activeOrganizationId || 'default' },
          with: { fields: true, forms: true },
        });

        if (!template) {
          throw new Error('Form template not found');
        }

        // Delete all forms
        await context.db.delete(tables.forms)
          .where(eq(tables.forms.templateId, args.id as string));

        // Delete all template fields
        await context.db.delete(tables.templateFields)
          .where(eq(tables.templateFields.templateId, args.id as string));

        // Delete the template
        await context.db.delete(tables.templates)
          .where(eq(tables.templates.id, args.id as string));

        return true;
      },
    })
  );

  return {
    TemplateFieldTypeEnumType,
    TemplateFieldType,
    TemplateType,
    FormFieldTypeEnumType,
    FormStatusEnumType,
    TemplateFieldInput,
    CreateTemplateInput,
    UpdateTemplateInput,
    UpdateFormInputType,
    FormFieldStatusEnumType,
    FormFieldType,
    FormType,
    FormFieldInputType,
    CreateFormInputType,
    CreateFormFromTemplateInputType,

    formsQuery,
    formQuery,
    createFormMutation,
    createFormFromTemplateMutation,
    updateFormMutation,
    deleteFormMutation,
    templatesQuery,
    templateQuery,
    createTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation,
  };
}