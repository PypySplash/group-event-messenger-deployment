import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { env } from "@/lib/env";

const client = new Client({
  connectionString: env.POSTGRES_URL,
  connectionTimeoutMillis: 5000,
  // Explicitly enable SSL for Render (and other cloud providers)
  // rejectUnauthorized: false is often required for self-signed certs or managed cloud DBs if not providing CA
  ssl: env.POSTGRES_URL.includes("localhost") 
    ? false 
    : { rejectUnauthorized: false }, 
});

// to use top level await (await outside of an async function)
// we need to enable it in the tsconfig.json file to make typescript happy.
// Change the "target" field to "es2017" in the tsconfig.json file.
// await client.connect(); // REMOVED for build safety

// Connect lazily or handle connection internally if possible, 
// BUT for Drizzle with node-postgres, we need a connected client mainly for queries.
// During build (static generation), Next.js might import this file.
// Taking out top-level await is safer. We can connect explicitly.
client.connect().catch((e) => {
  // Only log if not during build or if it's a critical runtime error
  if (process.env.NODE_ENV !== 'production') {
    console.warn("Script failed to connect to DB", e);
  }
});

export const db = drizzle(client);
