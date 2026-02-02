import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import { env } from "@/lib/env";

// Allow SSL for self-signed certificates (Render, Neon, etc.)
// We must parse the URL to potentially remove ?ssl=true if it conflicts with our explicit config
const getConnectionConfig = (url: string): PoolConfig => {
  try {
    const connectionUrl = new URL(url);
    const isLocal = url.includes("localhost");
    
    // In production, we need to ensure ?ssl=true in the string doesn't force rejectUnauthorized: true
    // So we strip it from the connection string and handle SSL strictly via the config object
    if (!isLocal) {
      connectionUrl.searchParams.delete("ssl");
      connectionUrl.searchParams.delete("sslmode");
    }

    return {
      connectionString: connectionUrl.toString(),
      connectionTimeoutMillis: 5000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    };
  } catch (error) {
    // Fallback if URL parsing fails (unlikely)
    console.error("Failed to parse DB URL for config", error);
    return {
      connectionString: url,
      ssl: { rejectUnauthorized: false }, // Hope for the best
    };
  }
};

const pool = new Pool(getConnectionConfig(env.POSTGRES_URL));

export const db = drizzle(pool);
