// Gemini integration. Uses @google/genai when GEMINI_API_KEY is set;
// otherwise returns a deterministic mock for offline development.
import { env, isMockMode } from "../config/env";
import { GeminiError } from "../utils/errors";
import { logger } from "../utils/logger";
import {
  EvaluationResult,
  evaluationResultSchema,
  geminiResponseJsonSchema,
} from "../validators/evaluation.validator";
import type { SupplierContextInput } from "./scoring-context.service";

interface GeminiCallInput {
  systemInstruction: string;
  userPrompt: string;
  suppliers: SupplierContextInput[];
}

/**
 * Build a deterministic mock evaluation. Used when no real API key is set.
 * Scores are derived from supplier/proposal text heuristics so that
 * results are stable across runs.
 */
function buildMockEvaluation(suppliers: SupplierContextInput[]): EvaluationResult {
  const scored = suppliers.map((s, i) => {
    const baseCompliance = 60 + (s.proposalText.length % 25);
    const technical = 55 + ((s.companyName.length + i * 7) % 30);
    const commercial = 50 + ((s.proposalText.length + i * 11) % 35);
    const risk = Math.max(5, 15 + (i * 3) % 15);
    const overall = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          baseCompliance * 0.35 +
            technical * 0.3 +
            commercial * 0.2 +
            (100 - risk) * 0.15,
        ),
      ),
    );
    return {
      rank: 0,
      supplierName: s.companyName,
      overallScorePercent: overall,
      proposalCompliancePercent: baseCompliance,
      technicalFitPercent: technical,
      commercialFitPercent: commercial,
      riskScorePercent: risk,
      shortReason: `Mock evaluation based on proposal and tender text heuristics for ${s.companyName}.`,
      strengths: [
        "Proposal includes structured response to tender requirements (mock).",
        "Proposal text provided for evaluation.",
      ],
      weaknesses: [
        "Detailed pricing breakdown is partially missing in the proposal.",
      ],
      riskFlags: risk > 20 ? ["Higher than average risk score in mock model."] : [],
      recommended: false,
    };
  });

  scored.sort((a, b) => b.overallScorePercent - a.overallScorePercent);
  scored.forEach((r, i) => {
    r.rank = i + 1;
    r.recommended = i === 0;
  });

  const best = scored[0];
  return {
    bestSupplier: best.supplierName,
    overallSummary: `Mock evaluation. ${best.supplierName} ranks first with ${best.overallScorePercent}% based on heuristic scores derived from proposal and tender text features. Replace GEMINI_API_KEY with a real key to perform a true AI-powered evaluation.`,
    ranking: scored,
    decisionNotes: [
      "This is a deterministic mock result; not produced by Gemini.",
      "Set GEMINI_API_KEY in apps/api/.env to enable real AI evaluation.",
    ],
    missingInformation: [
      "Real Gemini analysis (currently running in mock mode).",
    ],
    disclaimer:
      "AI evaluation is decision support only. Final procurement decision should be reviewed by a human.",
  };
}

interface GenAIClientLike {
  models: {
    generateContent: (req: {
      model: string;
      contents: unknown;
      config?: Record<string, unknown>;
    }) => Promise<{ text?: string }>;
  };
}

let cachedClient: GenAIClientLike | null = null;

async function getClient(): Promise<GenAIClientLike> {
  if (cachedClient) return cachedClient;
  // Dynamic import so that mock mode does not require the dependency to load.
  const mod = await import("@google/genai");
  const GoogleGenAI = (mod as unknown as { GoogleGenAI: new (cfg: { apiKey: string }) => GenAIClientLike }).GoogleGenAI;
  cachedClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return cachedClient;
}

async function callGemini(
  systemInstruction: string,
  userPrompt: string,
): Promise<string> {
  const client = await getClient();
  const result = await client.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: geminiResponseJsonSchema,
      temperature: 0.2,
    },
  });
  const text = (result.text ?? "").trim();
  if (!text) throw new GeminiError("Empty response from Gemini.");
  return text;
}

function parseJsonLoose(text: string): unknown {
  // Direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to locate the first { and last } and parse that slice
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const sliced = text.slice(start, end + 1);
      return JSON.parse(sliced);
    }
    throw new Error("Could not parse JSON from Gemini response.");
  }
}

/**
 * Run the Gemini evaluation. Falls back to mock mode automatically.
 * Retries once with a stricter prompt if the first response is invalid JSON.
 */
export async function runGeminiEvaluation(
  input: GeminiCallInput,
): Promise<EvaluationResult> {
  if (isMockMode()) {
    logger.info("Gemini service running in MOCK mode.");
    return buildMockEvaluation(input.suppliers);
  }

  const stricterReminder =
    "\n\nIMPORTANT: Return ONLY valid JSON conforming exactly to the schema. Do not include any commentary, code fences, or explanatory text.";

  const attempts: string[] = [input.userPrompt, input.userPrompt + stricterReminder];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const raw = await callGemini(input.systemInstruction, attempts[i]);
      const parsed = parseJsonLoose(raw);
      const validated = evaluationResultSchema.safeParse(parsed);
      if (!validated.success) {
        lastError = new GeminiError("Gemini returned JSON that did not match the schema.", {
          issues: validated.error.issues,
        });
        logger.warn("Gemini schema validation failed, will retry if attempts remain.", {
          attempt: i + 1,
        });
        continue;
      }
      // Ensure ranking is sorted descending and ranks are 1..n
      const sorted = [...validated.data.ranking].sort(
        (a, b) => b.overallScorePercent - a.overallScorePercent,
      );
      sorted.forEach((r, idx) => {
        r.rank = idx + 1;
        r.recommended = idx === 0;
      });
      validated.data.ranking = sorted;
      validated.data.bestSupplier = sorted[0].supplierName;
      return validated.data;
    } catch (err) {
      lastError = err;
      logger.warn("Gemini call failed", {
        attempt: i + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  throw new GeminiError(
    "Gemini evaluation failed after retries. " +
      (lastError instanceof Error ? lastError.message : "Unknown error"),
  );
}
