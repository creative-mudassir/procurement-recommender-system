// Express app composition. Keeping this separate from server.ts makes
// integration testing with supertest straightforward.
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { env } from "./config/env";
import { evaluationRouter } from "./routes/evaluation.routes";
import { projectsRouter } from "./routes/projects.routes";
import { toErrorResponse } from "./utils/errors";
import { logger } from "./utils/logger";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/api", projectsRouter);
  app.use("/api/evaluations", evaluationRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: { message: `Route not found: ${req.method} ${req.path}`, code: "VALIDATION_ERROR", details: {} },
    });
  });

  // Centralized error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const { status, body } = toErrorResponse(err);
    if (status >= 500) {
      logger.error("Unhandled error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    res.status(status).json(body);
  });

  return app;
}
