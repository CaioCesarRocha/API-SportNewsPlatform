type DatabaseConfig = {
  connectionString?: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
};

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

const databaseConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? "localhost",
  port: parsePort(process.env.DB_PORT),
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_NAME ?? "sportnews",
  ssl: process.env.DB_SSL === "true",
};

export default databaseConfig;
