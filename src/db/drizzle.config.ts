import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile();
} catch (error) {
  const envError = error as NodeJS.ErrnoException;

  if (envError.code !== "ENOENT") {
    throw error;
  }
}

function parsePort(value?: string): number {
  const port = Number(value ?? "5432");

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("DB_PORT must be a positive integer.");
  }

  return port;
}

const url = process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: url
    ? { url }
    : {
        host: process.env.DB_HOST ?? "localhost",
        port: parsePort(process.env.DB_PORT),
        user: process.env.DB_USER ?? "postgres",
        password: process.env.DB_PASSWORD ?? "postgres",
        database: process.env.DB_NAME ?? "sportnews",
        ssl: process.env.DB_SSL === "true",
      },
});
