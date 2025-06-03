import { appTables, authTables } from "./tables";
import { relations } from "./relations";

export const tables = {
  ...appTables,
  ...authTables,
};

export default {
  relations,
  tables,
};
