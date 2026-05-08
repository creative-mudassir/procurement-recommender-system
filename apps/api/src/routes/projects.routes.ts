// Health/status endpoints for the API.
import { Router } from "express";

export const projectsRouter = Router();

projectsRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "Tender Supplier Evaluation AI API" });
});
