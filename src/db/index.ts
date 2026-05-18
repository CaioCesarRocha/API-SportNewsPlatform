import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import databaseConfig from "./config";
import * as schema from "./schema";

const ssl = databaseConfig.ssl ? { rejectUnauthorized: false } : false;

export const pool = databaseConfig.connectionString
  ? new Pool({
      connectionString: databaseConfig.connectionString,
      ssl,
    })
  : new Pool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      user: databaseConfig.user,
      password: databaseConfig.password,
      database: databaseConfig.database,
      ssl,
    });

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("select 1");
  } finally {
    client.release();
  }
}
