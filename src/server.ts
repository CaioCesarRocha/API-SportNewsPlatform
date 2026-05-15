import express from "express";

import { checkDatabaseConnection } from "./db";
import routes from "./routes";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((request, response, next) => {
  const requestOrigin = request.headers.origin;

  if (!requestOrigin) {
    return next();
  }

  if (!allowedOrigins || allowedOrigins.length === 0) {
    response.header("Access-Control-Allow-Origin", "*");
  } else if (allowedOrigins.includes(requestOrigin)) {
    response.header("Access-Control-Allow-Origin", requestOrigin);
    response.header("Vary", "Origin");
  }

  response.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    return response.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(routes);

async function startServer(): Promise<void> {
  try {
    await checkDatabaseConnection();
    console.log("PostgreSQL connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to PostgreSQL.", error);
    process.exit(1);
  }
}

void startServer();
