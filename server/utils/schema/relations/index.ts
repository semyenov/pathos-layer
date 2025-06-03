import { defineRelations } from "drizzle-orm";
import { appTables, authTables } from "../tables";

export const relations = defineRelations(
  {
    ...appTables,
    ...authTables,
  },
  (t) => ({
    users: {
      accounts: t.many.accounts({
        from: t.users.id,
        to: t.accounts.userId,
        alias: "UserIdToAccountUserId",
      }),
      sessions: t.many.sessions({
        from: t.users.id,
        to: t.sessions.userId,
        alias: "UserIdToSessionUserId",
      }),
      members: t.many.members({
        from: t.users.id,
        to: t.members.userId,
        alias: "UserIdToMemberUserId",
      }),
      organizations: t.many.organizations({
        from: t.users.id,
        to: t.organizations.id,
        alias: "UserIdToOrganizationId",
      }),
      organizationsOwner: t.many.organizations({
        from: t.users.id,
        to: t.organizations.ownerId,
        alias: "UserIdToOrganizationOwnerId",
      }),
      lastModifiedMembers: t.many.members({
        from: t.users.id,
        to: t.members.lastModifiedBy,
        alias: "UserIdToMemberLastModifiedByUserId",
      }),
      lastModifiedOrganizations: t.many.organizations({
        from: t.users.id,
        to: t.organizations.lastModifiedBy,
        alias: "UserIdToOrganizationLastModifiedByUserId",
      }),
      lastModifiedForms: t.many.forms({
        from: t.users.id,
        to: t.forms.lastModifiedBy,
        alias: "UserIdToFormLastModifiedByUserId",
      }),
      lastModifiedReviewFlows: t.many.reviewFlows({
        from: t.users.id,
        to: t.reviewFlows.lastModifiedBy,
        alias: "UserIdToReviewFlowLastModifiedByUserId",
      }),
      lastModifiedFileFolders: t.many.fileFolders({
        from: t.users.id,
        to: t.fileFolders.lastModifiedBy,
        alias: "UserIdToFileFolderLastModifiedByUserId",
      }),
      lastModifiedFiles: t.many.files({
        from: t.users.id,
        to: t.files.lastModifiedBy,
        alias: "UserIdToFileLastModifiedByUserId",
      }),
      lastModifiedInvitations: t.many.invitations({
        from: t.users.id,
        to: t.invitations.lastModifiedBy,
        alias: "UserIdToInvitationLastModifiedByUserId",
      }),
      lastModifiedFormFields: t.many.formFields({
        from: t.users.id,
        to: t.formFields.lastModifiedBy,
        alias: "UserIdToFormFieldLastModifiedByUserId",
      }),
      lastModifiedTemplateFields: t.many.templateFields({
        from: t.users.id,
        to: t.templateFields.lastModifiedBy,
        alias: "UserIdToTemplateFieldLastModifiedByUserId",
      }),
      lastModifiedComments: t.many.comments({
        from: t.users.id,
        to: t.comments.lastModifiedBy,
        alias: "UserIdToCommentLastModifiedByUserId",
      }),
      lastModifiedBy: t.one.users({
        from: t.users.lastModifiedBy,
        to: t.users.id,
        alias: "UserIdToLastModifiedByUserId",
      }),
    },
    sessions: {
      user: t.one.users({
        from: t.sessions.userId,
        to: t.users.id,
        alias: "SessionUserIdToUserId",
      }),
      activeOrganization: t.one.organizations({
        from: t.sessions.activeOrganizationId,
        to: t.organizations.id,
        alias: "SessionActiveOrganizationIdToOrganizationId",
      }),
      impersonatedBy: t.one.users({
        from: t.sessions.impersonatedBy,
        to: t.users.id,
        alias: "SessionImpersonatedByUserIdToUserId",
      }),
    },
    accounts: {
      user: t.one.users({
        from: t.accounts.userId,
        to: t.users.id,
        alias: "AccountUserIdToUserId",
      }),
    },
    forms: {
      fields: t.many.formFields({
        from: t.forms.id,
        to: t.formFields.formId,
        alias: "FormIdToFormFieldFormId",
      }),
      organization: t.one.organizations({
        from: t.forms.organizationId,
        to: t.organizations.id,
        alias: "FormOrganizationIdToOrganizationId",
      }),
      template: t.one.templates({
        from: t.forms.templateId,
        to: t.templates.id,
        alias: "FormTemplateIdToTemplateId",
      }),
      history: t.many.formHistories({
        from: t.forms.id,
        to: t.formHistories.formId,
        alias: "FormIdToFormHistoryFormId",
      }),
      reviewFlow: t.many.reviewFlows({
        from: t.forms.id,
        to: t.reviewFlows.formId,
        alias: "FormIdToReviewFlowFormId",
      }),
      lastModifiedBy: t.one.users({
        from: t.forms.lastModifiedBy,
        to: t.users.id,
        alias: "FormLastModifiedByUserIdToUserId",
      }),
    },
    formFields: {
      form: t.one.forms({
        from: t.formFields.formId,
        to: t.forms.id,
        alias: "FormFieldFormIdToFormId",
      }),
      comments: t.many.comments({
        from: t.formFields.id,
        to: t.comments.formFieldId,
        alias: "FormFieldIdToCommentFormFieldId",
      }),
      templateField: t.one.templateFields({
        from: t.formFields.templateFieldId,
        to: t.templateFields.id,
        alias: "FormFieldTemplateFieldIdToTemplateFieldId",
      }),
      lastModifiedBy: t.one.users({
        from: t.formFields.lastModifiedBy,
        to: t.users.id,
        alias: "FormFieldLastModifiedByUserIdToUserId",
      }),
    },
    templates: {
      fields: t.many.templateFields({
        from: t.templates.id,
        to: t.templateFields.templateId,
        alias: "TemplateIdToTemplateFieldTemplateId",
      }),
      forms: t.many.forms({
        from: t.templates.id,
        to: t.forms.templateId,
        alias: "TemplateIdToFormTemplateId",
      }),
      lastModifiedBy: t.one.users({
        from: t.templates.lastModifiedBy,
        to: t.users.id,
        alias: "TemplateLastModifiedByUserIdToUserId",
      }),
    },
    templateFields: {
      template: t.one.templates({
        from: t.templateFields.templateId,
        to: t.templates.id,
        alias: "TemplateFieldTemplateIdToTemplateId",
      }),
      formFields: t.many.formFields({
        from: t.templateFields.id,
        to: t.formFields.templateFieldId,
        alias: "TemplateFieldIdToFormFieldFormFieldId",
      }),
      lastModifiedBy: t.one.users({
        from: t.templateFields.lastModifiedBy,
        to: t.users.id,
        alias: "TemplateFieldLastModifiedByUserIdToUserId",
      }),
    },
    organizations: {
      owner: t.one.members({
        from: t.organizations.ownerId,
        to: t.members.id,
        alias: "OrganizationOwnerIdToMemberId",
      }),
      members: t.many.members({
        from: t.organizations.id,
        to: t.members.organizationId,
        alias: "OrganizationIdToMemberOrganizationId",
      }),
      forms: t.many.forms({
        from: t.organizations.id,
        to: t.forms.organizationId,
        alias: "OrganizationIdToFormOrganizationId",
      }),
      reviewFlows: t.many.reviewFlows({
        from: t.organizations.id,
        to: t.reviewFlows.organizationId,
        alias: "OrganizationIdToReviewFlowOrganizationId",
      }),
      invitations: t.many.invitations({
        from: t.organizations.id,
        to: t.invitations.organizationId,
        alias: "OrganizationIdToInvitationOrganizationId",
      }),
      fileFolders: t.many.fileFolders({
        from: t.organizations.id,
        to: t.fileFolders.organizationId,
        alias: "OrganizationIdToFileFolderOrganizationId",
      }),
      files: t.many.files({
        from: t.organizations.id,
        to: t.files.organizationId,
        alias: "OrganizationIdToFileOrganizationId",
      }),
      lastModifiedBy: t.one.users({
        from: t.organizations.lastModifiedBy,
        to: t.users.id,
        alias: "OrganizationLastModifiedByUserIdToUserId",
      }),
    },
    members: {
      user: t.one.users({
        from: t.members.userId,
        to: t.users.id,
        alias: "MemberUserIdToUserId",
      }),
      organization: t.one.organizations({
        from: t.members.organizationId,
        to: t.organizations.id,
        alias: "MemberOrganizationIdToOrganizationId",
      }),
      comments: t.many.comments({
        from: t.members.id,
        to: t.comments.memberId,
        alias: "MemberIdToCommentMemberId",
      }),
      uploadedFiles: t.many.files({
        from: t.members.id,
        to: t.files.uploaderMemberId,
        alias: "MemberIdToFileUploaderMemberId",
      }),
      createdFileFolders: t.many.fileFolders({
        from: t.members.id,
        to: t.fileFolders.creatorMemberId,
        alias: "MemberIdToFileFolderCreatorMemberId",
      }),
      lastModifiedBy: t.one.users({
        from: t.members.lastModifiedBy,
        to: t.users.id,
        alias: "MemberLastModifiedByUserIdToUserId",
      }),
    },
    reviewFlows: {
      form: t.one.forms({
        from: t.reviewFlows.formId,
        to: t.forms.id,
        alias: "ReviewFlowFormIdToFormId",
      }),
      organization: t.one.organizations({
        from: t.reviewFlows.organizationId,
        to: t.organizations.id,
        alias: "ReviewFlowOrganizationIdToOrganizationId",
      }),
      comments: t.many.comments({
        from: t.reviewFlows.id,
        to: t.comments.reviewFlowId,
        alias: "ReviewFlowIdToCommentReviewFlowId",
      }),
      lastModifiedBy: t.one.users({
        from: t.reviewFlows.lastModifiedBy,
        to: t.users.id,
        alias: "ReviewFlowLastModifiedByUserIdToUserId",
      }),
    },
    comments: {
      member: t.one.members({
        from: t.comments.memberId,
        to: t.members.id,
        alias: "CommentMemberIdToMemberId",
      }),
      form: t.one.forms({
        from: t.comments.formId,
        to: t.forms.id,
        alias: "CommentFormIdToFormId",
      }),
      formField: t.one.formFields({
        from: t.comments.formFieldId,
        to: t.formFields.id,
        alias: "CommentFormFieldIdToFormFieldId",
      }),
      reviewFlow: t.one.reviewFlows({
        from: t.comments.reviewFlowId,
        to: t.reviewFlows.id,
        alias: "CommentReviewFlowIdToReviewFlowId",
      }),
      lastModifiedBy: t.one.users({
        from: t.comments.lastModifiedBy,
        to: t.users.id,
        alias: "CommentLastModifiedByUserIdToUserId",
      }),
    },
    invitations: {
      organization: t.one.organizations({
        from: t.invitations.organizationId,
        to: t.organizations.id,
        alias: "InvitationOrganizationIdToOrganizationId",
      }),
      inviter: t.one.users({
        from: t.invitations.inviterId,
        to: t.users.id,
        alias: "InvitationInviterIdToUserId",
      }),
      lastModifiedBy: t.one.users({
        from: t.invitations.lastModifiedBy,
        to: t.users.id,
        alias: "InvitationLastModifiedByUserIdToUserId",
      }),
    },
    files: {
      fileFolder: t.one.fileFolders({
        from: t.files.fileFolderId,
        to: t.fileFolders.id,
        alias: "FileFileFolderIdToFileFolderId",
      }),
      organization: t.one.organizations({
        from: t.files.organizationId,
        to: t.organizations.id,
        alias: "FileOrganizationIdToOrganizationId",
      }),
      uploaderMember: t.one.members({
        from: t.files.uploaderMemberId,
        to: t.members.id,
        alias: "FileUploaderMemberIdToMemberId",
      }),
      lastModifiedByMember: t.one.members({
        from: t.files.lastModifiedBy,
        to: t.members.id,
        alias: "FileLastModifiedByMemberIdToMemberId",
      }),
      lastModifiedBy: t.one.users({
        from: t.files.lastModifiedBy,
        to: t.users.id,
        alias: "FileLastModifiedByUserIdToUserId",
      }),
    },
    fileFolders: {
      files: t.many.files({
        from: t.fileFolders.id,
        to: t.files.fileFolderId,
        alias: "FileFolderIdToFileFileFolderId",
      }),
      parent: t.one.fileFolders({
        from: t.fileFolders.parentId,
        to: t.fileFolders.id,
        alias: "FileFolderParentIdToFileFolderId",
      }),
      organization: t.one.organizations({
        from: t.fileFolders.organizationId,
        to: t.organizations.id,
        alias: "FileFolderOrganizationIdToOrganizationId",
      }),
      creatorMember: t.one.members({
        from: t.fileFolders.creatorMemberId,
        to: t.members.id,
        alias: "FileFolderCreatorMemberIdToMemberId",
      }),
      lastModifiedBy: t.one.users({
        from: t.fileFolders.lastModifiedBy,
        to: t.users.id,
        alias: "FileFolderLastModifiedByUserIdToUserId",
      }),
    },
  }),
);
