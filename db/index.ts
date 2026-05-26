import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const getDb = () => {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
       throw new Error("CRITICAL SERVER ERROR: DATABASE_URL is missing from environment.");
    }
    // Return a proxy or mock if it's just building components
    return drizzle(neon("postgres://mock:mock@mock/mock"), { schema });
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
};

export const db = getDb();
