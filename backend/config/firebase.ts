import { db as mysqlDb } from "./database";

export const db = mysqlDb; // { query: pool.execute }

console.log("[DB] Using MySQL db wrapper in firebase.ts");

export default { db };
