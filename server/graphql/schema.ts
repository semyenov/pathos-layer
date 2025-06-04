import { useBuilder } from "./builder";
import { printSchema } from "graphql";
import fs from "node:fs";

import { addAuthTypes } from "./types/auth";
import { addOrganizationTypes } from "./types/organization";
import { addTemplateTypes } from "./types/template";
import { addCommentTypes } from "./types/comment";
import { addReviewFlowTypes } from "./types/reviewFlow";
import { addSessionTypes } from "./types/session";
import { addMemberTypes } from "./types/member";
import "./shield";

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

if (process.env.NODE_ENV === 'development') {
  fs.writeFileSync('schema.graphql', printSchema(schema));
}