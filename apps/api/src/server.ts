// Boot the HTTP server.
import { createApp } from "./app";
import { env, isMockMode } from "./config/env";
import { getDb } from "./db/db";
import { logger } from "./utils/logger";

function main() {
  // Initialize SQLite eagerly so schema migrations run on startup.
  getDb();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`, {
      clientUrl: env.CLIENT_URL,
      mockMode: isMockMode(),
    });
  });
}

main();
