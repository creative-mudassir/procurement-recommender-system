// Main evaluation route — orchestrates document extraction,
// Gemini evaluation, and SQLite persistence.
import { Router, type Request } from "express";
import multer from "multer";
import { env } from "../config/env";
import {
  evaluationsRepo,
  projectsRepo,
  suppliersRepo,
} from "../db/repositories";
import {
  extractMergedSupplierText,
  extractTextFromFile,
  type UploadedFileLike,
} from "../services/document.service";
import { runGeminiEvaluation } from "../services/gemini.service";
import {
  buildGeminiContext,
  type SupplierContextInput,
} from "../services/scoring-context.service";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";
import { sanitizeFileName } from "../utils/text";
import { suppliersJsonSchema } from "../validators/evaluation.validator";

export const evaluationRouter = Router();

const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.originalname = sanitizeFileName(file.originalname);
    const lower = file.originalname.toLowerCase();
    const okByExt =
      lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt");
    if (ACCEPTED_MIMES.has(file.mimetype) || okByExt) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Unsupported file type: ${file.originalname}`));
    }
  },
});

/**
 * We accept a dynamic set of upload fields because each supplier has its own
 * field name (`supplierFiles_<id>`). `multer.any()` keeps things flexible.
 */
const uploadAny = upload.any();

interface ParsedSupplier {
  id: string;
  companyName: string;
  files: UploadedFileLike[];
}

function groupRequest(req: Request): {
  tenderTitle: string;
  tenderFile: UploadedFileLike;
  suppliers: ParsedSupplier[];
} {
  const tenderTitle = (req.body?.tenderTitle ?? "").toString().trim();
  if (!tenderTitle) throw new ValidationError("tenderTitle is required.");

  const suppliersJson = (req.body?.suppliersJson ?? "").toString();
  let parsed: unknown;
  try {
    parsed = JSON.parse(suppliersJson);
  } catch {
    throw new ValidationError("suppliersJson is not valid JSON.");
  }
  const suppliersResult = suppliersJsonSchema.safeParse(parsed);
  if (!suppliersResult.success) {
    throw new ValidationError("Invalid suppliers payload.", {
      issues: suppliersResult.error.issues,
    });
  }
  const supplierMeta = suppliersResult.data;

  const files = (req.files ?? []) as Express.Multer.File[];
  const tenderFile = files.find((f) => f.fieldname === "tenderFile");
  if (!tenderFile) throw new ValidationError("tenderFile is required.");

  const suppliers: ParsedSupplier[] = supplierMeta.map((s) => {
    const supplierFiles = files.filter(
      (f) => f.fieldname === `supplierFiles_${s.id}`,
    );
    if (supplierFiles.length === 0) {
      throw new ValidationError(
        `At least one proposal file is required for supplier "${s.companyName}".`,
      );
    }
    return {
      id: s.id,
      companyName: s.companyName,
      files: supplierFiles,
    };
  });

  return { tenderTitle, tenderFile, suppliers };
}

evaluationRouter.post("/run", uploadAny, async (req, res, next) => {
  try {
    const { tenderTitle, tenderFile, suppliers } = groupRequest(req);

    logger.info("Evaluation request received", {
      tenderTitle,
      suppliers: suppliers.map((s) => ({
        id: s.id,
        companyName: s.companyName,
        files: s.files.length,
      })),
    });

    // 1. Extract tender text
    const tenderText = await extractTextFromFile(tenderFile);

    // 2. Extract supplier proposal texts in parallel
    const supplierTexts = await Promise.all(
      suppliers.map((s) => extractMergedSupplierText(s.files)),
    );

    // 3. Build context input list
    const supplierContexts: SupplierContextInput[] = suppliers.map((s, i) => ({
      id: s.id,
      companyName: s.companyName,
      proposalText: supplierTexts[i],
    }));

    // 4. Build Gemini context and call Gemini
    const ctx = buildGeminiContext({
      tenderTitle,
      tenderText,
      suppliers: supplierContexts,
    });

    const result = await runGeminiEvaluation({
      systemInstruction: ctx.systemInstruction,
      userPrompt: ctx.userPrompt,
      suppliers: supplierContexts,
    });

    // 5. Persist to SQLite
    const project = projectsRepo.create(tenderTitle);
    for (let i = 0; i < suppliers.length; i++) {
      suppliersRepo.create({
        projectId: project.id,
        companyName: suppliers[i].companyName,
        proposalText: supplierTexts[i].slice(0, 200_000),
      });
    }
    const evaluation = evaluationsRepo.create(
      project.id,
      JSON.stringify(result),
    );

    res.json({
      projectId: project.id,
      evaluationId: evaluation.id,
      result,
    });
  } catch (err) {
    next(err);
  }
});
