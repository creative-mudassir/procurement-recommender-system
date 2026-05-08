// Shared TypeScript types between frontend and backend boundary.

export interface Supplier {
  id: string;
  companyName: string;
  files: File[];
}

export interface RankingItem {
  rank: number;
  supplierName: string;
  overallScorePercent: number;
  proposalCompliancePercent: number;
  technicalFitPercent: number;
  commercialFitPercent: number;
  riskScorePercent: number;
  shortReason: string;
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
  recommended: boolean;
}

export interface EvaluationResult {
  bestSupplier: string;
  overallSummary: string;
  ranking: RankingItem[];
  decisionNotes: string[];
  missingInformation: string[];
  disclaimer: string;
}

export interface EvaluationApiResponse {
  projectId: string;
  evaluationId: string;
  result: EvaluationResult;
}

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}
