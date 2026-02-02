import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  connectionTimeoutMillis: 5000,
  // Explicitly enable SSL for Render (and other cloud providers)
  // rejectUnauthorized: false is often required for self-signed certs or managed cloud DBs if not providing CA
  ssl: env.POSTGRES_URL.includes("localhost") 
    ? false 
    : { rejectUnauthorized: false }, 
});

export const db = drizzle(pool);
