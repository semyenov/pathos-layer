import appTables from "./app";
import authTables from "./auth";

export const tables = {
  ...authTables,
  ...appTables,
};
