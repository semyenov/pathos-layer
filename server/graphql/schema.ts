import { useBuilder } from "./builder";

import { addAuthTypes } from "./types/auth";
import { addOrganizationTypes } from "./types/organization";
import { addTemplateTypes } from "./types/template";
import { addCommentTypes } from "./types/comment";
import { addReviewFlowTypes } from "./types/reviewFlow";
import { addSessionTypes } from "./types/session";
import { addMemberTypes } from "./types/member";

const builder = useBuilder();

addSessionTypes(builder);
addAuthTypes(builder);
addMemberTypes(builder);
addOrganizationTypes(builder);
addTemplateTypes(builder);
addCommentTypes(builder);
addReviewFlowTypes(builder);

const schema = builder.toSchema({ sortSchema: true });

export type Schema = typeof schema;
export const useSchema = (): Schema => schema;
