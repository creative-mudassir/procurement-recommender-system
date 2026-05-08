import path from "path";
import os from "os";
import fs from "fs";
import { afterAll, describe, expect, it, vi } from "vitest";

// Use an in-memory-ish SQLite path under a temp dir to keep tests isolated.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tea-test-"));
process.env.SQLITE_PATH = path.join(tmpDir, "test.sqlite");
process.env.GEMINI_API_KEY = "mock";
process.env.CLIENT_URL = "http://localhost:5173";

// Mock Gemini to ensure deterministic outputs even though we're already in mock mode
vi.mock("../src/services/gemini.service", () => ({
  runGeminiEvaluation: vi.fn(async ({ suppliers }: { suppliers: { companyName: string }[] }) => ({
    bestSupplier: suppliers[0].companyName,
    overallSummary: "Mocked overall summary.",
    ranking: suppliers.map((s, i) => ({
      rank: i + 1,
      supplierName: s.companyName,
      overallScorePercent: 90 - i * 10,
      proposalCompliancePercent: 80,
      technicalFitPercent: 80,
      commercialFitPercent: 80,
      riskScorePercent: 10,
      shortReason: "Mocked",
      strengths: ["a"],
      weaknesses: ["b"],
      riskFlags: [],
      recommended: i === 0,
    })),
    decisionNotes: ["mock"],
    missingInformation: [],
    disclaimer: "AI evaluation is decision support only. Final procurement decision should be reviewed by a human.",
  })),
}));

import request from "supertest";
import { createApp } from "../src/app";
import { resetDbForTests } from "../src/db/db";

const app = createApp();

afterAll(() => {
  resetDbForTests();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe("GET /api/health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: "Tender Supplier Evaluation AI API" });
  });
});

describe("POST /api/evaluations/run validation", () => {
  it("rejects missing tender file", async () => {
    const res = await request(app)
      .post("/api/evaluations/run")
      .field("tenderTitle", "Test Tender")
      .field(
        "suppliersJson",
        JSON.stringify([
          { id: "s1", companyName: "Alpha Ltd" },
          { id: "s2", companyName: "Beta Ltd" },
        ]),
      );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects fewer than 2 suppliers", async () => {
    const res = await request(app)
      .post("/api/evaluations/run")
      .field("tenderTitle", "Test Tender")
      .field("suppliersJson", JSON.stringify([{ id: "s1", companyName: "Alpha Ltd" }]))
      .attach("tenderFile", Buffer.from("Tender content"), {
        filename: "tender.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects supplier without proposal file", async () => {
    const res = await request(app)
      .post("/api/evaluations/run")
      .field("tenderTitle", "Test Tender")
      .field(
        "suppliersJson",
        JSON.stringify([
          { id: "s1", companyName: "Alpha Ltd" },
          { id: "s2", companyName: "Beta Ltd" },
        ]),
      )
      .attach("tenderFile", Buffer.from("Tender content"), {
        filename: "tender.txt",
        contentType: "text/plain",
      })
      .attach("supplierFiles_s1", Buffer.from("Alpha proposal content"), {
        filename: "alpha.txt",
        contentType: "text/plain",
      });
    // s2 has no files
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects supplier with empty company name", async () => {
    const res = await request(app)
      .post("/api/evaluations/run")
      .field("tenderTitle", "Test Tender")
      .field(
        "suppliersJson",
        JSON.stringify([
          { id: "s1", companyName: "" },
          { id: "s2", companyName: "Beta Ltd" },
        ]),
      )
      .attach("tenderFile", Buffer.from("Tender content"), {
        filename: "tender.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("runs full evaluation with mocked services", async () => {
    const res = await request(app)
      .post("/api/evaluations/run")
      .field("tenderTitle", "Test Tender")
      .field(
        "suppliersJson",
        JSON.stringify([
          { id: "s1", companyName: "Alpha Ltd" },
          { id: "s2", companyName: "Beta Ltd" },
        ]),
      )
      .attach("tenderFile", Buffer.from("Tender content with requirements section."), {
        filename: "tender.txt",
        contentType: "text/plain",
      })
      .attach("supplierFiles_s1", Buffer.from("Alpha proposal content"), {
        filename: "alpha.txt",
        contentType: "text/plain",
      })
      .attach("supplierFiles_s2", Buffer.from("Beta proposal content"), {
        filename: "beta.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(200);
    expect(res.body.projectId).toBeTruthy();
    expect(res.body.evaluationId).toBeTruthy();
    expect(res.body.result.bestSupplier).toBe("Alpha Ltd");
  });
});
