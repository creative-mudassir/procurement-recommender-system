// Centralized environment loader. All env access in the application
// must go through this module to keep configuration consistent.
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Resolve env files from common launch contexts:
// - apps/api/.env (package-local, preferred)
// - workspace root .env (fallback for convenience)
const apiRoot = path.resolve(__dirname, "..", "..");
const envCandidates = [
  path.resolve(apiRoot, ".env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps", "api", ".env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

function num(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  PORT: num(process.env.PORT, 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "mock",
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  MAX_UPLOAD_MB: num(process.env.MAX_UPLOAD_MB, 20),
  MAX_GEMINI_CONTEXT_CHARS: num(process.env.MAX_GEMINI_CONTEXT_CHARS, 120000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

export const isMockMode = (): boolean => {
  const key = env.GEMINI_API_KEY?.trim().toLowerCase();
  return !key || key === "mock" || key === "replace_me";
};
