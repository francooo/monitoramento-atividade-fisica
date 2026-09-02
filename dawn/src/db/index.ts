import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não está definida. Copie .env.example para .env e cole a connection string do Neon.",
  );
}

// Driver HTTP: cada query é um round-trip, sem pool de conexões — é o modo
// certo para funções serverless, que não sobrevivem entre requisições.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema, casing: "snake_case" });
export { schema };
