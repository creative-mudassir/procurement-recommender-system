// Builds the compact, structured context that we send to Gemini.
import { env } from "../config/env";
import { truncateText } from "../utils/text";

export interface SupplierContextInput {
  id: string;
  companyName: string;
  proposalText: string;
}

export interface BuiltContext {
  systemInstruction: string;
  userPrompt: string;
}

const SYSTEM_INSTRUCTION = `You are an expert public procurement and supplier evaluation assistant. Your task is to compare supplier proposals against a tender contract requirement using only the provided tender text and supplier proposal text. You must be fair, evidence-based, and conservative. Do not invent facts. If Company name and their history data is unavailable or incomplete on internet, clearly say so. Do not treat historical data as proof of current suitability; use them only as supporting context. Evaluate each supplier on tender compliance, technical fit, commercial fit, relevant past experience, risks, clarity, and completeness. Return only valid JSON matching the provided schema. Scores must be percentages from 0 to 100. The final ranking must be sorted from best to worst. The best supplier should have recommended=true. Give short but meaningful reasons.`;


/**
 * Build the user prompt and trim sizes so total context stays within
 * MAX_GEMINI_CONTEXT_CHARS.
 */
export function buildGeminiContext(input: {
  tenderTitle: string;
  tenderText: string;
  suppliers: SupplierContextInput[];
}): BuiltContext {
  const totalBudget = env.MAX_GEMINI_CONTEXT_CHARS;
  const suppliersCount = Math.max(1, input.suppliers.length);

  // Allocate budget: 35% tender, 60% suppliers (split equally), 5% overhead
  const tenderBudget = Math.floor(totalBudget * 0.35);
  const perSupplierBudget = Math.floor((totalBudget * 0.6) / suppliersCount);

  const tenderText = truncateText(input.tenderText, tenderBudget);

  const supplierBlocks = input.suppliers.map((s) => {
    const proposal = truncateText(s.proposalText, perSupplierBudget);
    return [
      `Supplier Name:\n${s.companyName}`,
      `Supplier Proposal Text:\n${proposal}`,
    ].join("\n\n");
  });

  const userPrompt = [
    `Tender Title:\n${input.tenderTitle}`,
    `Tender Contract Details:\n${tenderText}`,
    `Suppliers:\n${supplierBlocks.join("\n\n=====\n\n")}`,
    [
      "Evaluation Instructions:",
      "1. Compare every supplier proposal against the tender contract requirements.",
      "2. Score each supplier percentage-wise.",
      "3. Decide which supplier is best overall.",
      "4. Explain briefly why.",
      "5. Mention missing information.",
      "6. Mention risk flags.",
      "7. Do not invent information.",
      "8. Return only JSON.",
      "",
      "Scoring Guidance (default weights unless tender says otherwise):",
      "- Tender requirement compliance: 35%",
      "- Technical/solution fit: 30%",
      "- Commercial/value fit: 20%",
      "- Risk and completeness: 15%",
      "Higher riskScorePercent means higher risk and should reduce overallScorePercent.",
    ].join("\n"),
  ].join("\n\n");

  return { systemInstruction: SYSTEM_INSTRUCTION, userPrompt };
}
