// Zod schemas for validating Gemini's evaluation JSON output and
// the multipart request payload.
import { z } from "zod";

export const supplierInputSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1).max(300),
});
export type SupplierInput = z.infer<typeof supplierInputSchema>;

export const suppliersJsonSchema = z
  .array(supplierInputSchema)
  .min(2, "At least 2 suppliers are required for evaluation.");

export const rankingItemSchema = z.object({
  rank: z.number().int().min(1),
  supplierName: z.string().min(1),
  overallScorePercent: z.number().min(0).max(100),
  proposalCompliancePercent: z.number().min(0).max(100),
  technicalFitPercent: z.number().min(0).max(100),
  commercialFitPercent: z.number().min(0).max(100),
  riskScorePercent: z.number().min(0).max(100),
  shortReason: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  riskFlags: z.array(z.string()),
  recommended: z.boolean(),
});
export type RankingItem = z.infer<typeof rankingItemSchema>;

export const evaluationResultSchema = z.object({
  bestSupplier: z.string().min(1),
  overallSummary: z.string().min(1),
  ranking: z.array(rankingItemSchema).min(1),
  decisionNotes: z.array(z.string()),
  missingInformation: z.array(z.string()),
  disclaimer: z.string().min(1),
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

// JSON schema (Draft used by Gemini structured output).
export const geminiResponseJsonSchema = {
  type: "object",
  properties: {
    bestSupplier: { type: "string" },
    overallSummary: { type: "string" },
    ranking: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rank: { type: "integer" },
          supplierName: { type: "string" },
          overallScorePercent: { type: "number" },
          proposalCompliancePercent: { type: "number" },
          technicalFitPercent: { type: "number" },
          commercialFitPercent: { type: "number" },
          riskScorePercent: { type: "number" },
          shortReason: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          riskFlags: { type: "array", items: { type: "string" } },
          recommended: { type: "boolean" },
        },
        required: [
          "rank",
          "supplierName",
          "overallScorePercent",
          "proposalCompliancePercent",
          "technicalFitPercent",
          "commercialFitPercent",
          "riskScorePercent",
          "shortReason",
          "strengths",
          "weaknesses",
          "riskFlags",
          "recommended",
        ],
      },
    },
    decisionNotes: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
  },
  required: [
    "bestSupplier",
    "overallSummary",
    "ranking",
    "decisionNotes",
    "missingInformation",
    "disclaimer",
  ],
} as const;
