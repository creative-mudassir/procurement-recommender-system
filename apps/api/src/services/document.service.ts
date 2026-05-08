// Reads PDF/DOCX/TXT buffers and returns clean, normalized text.
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { FileParseError, UnsupportedFileTypeError } from "../utils/errors";
import { normalizeWhitespace, truncateText } from "../utils/text";

export type SupportedMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain";

export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const MAX_RAW_TEXT = 1_500_000; // safety cap on raw extracted text per file

function detectKind(file: UploadedFileLike): "pdf" | "docx" | "txt" {
  const name = (file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  if (mime.startsWith("text/") || name.endsWith(".txt")) return "txt";
  throw new UnsupportedFileTypeError(
    `Unsupported file type for "${file.originalname}". Supported: PDF, DOCX, TXT.`,
    { mimetype: mime, name: file.originalname },
  );
}

/**
 * Extract text content from an uploaded file buffer.
 */
export async function extractTextFromFile(
  file: UploadedFileLike,
): Promise<string> {
  if (!file || !file.buffer) {
    throw new FileParseError("Empty file buffer.");
  }
  const kind = detectKind(file);

  try {
    let raw = "";
    if (kind === "pdf") {
      const result = await pdfParse(file.buffer);
      raw = result.text || "";
    } else if (kind === "docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      raw = result.value || "";
    } else {
      raw = file.buffer.toString("utf-8");
    }

    if (!raw.trim()) {
      throw new FileParseError(
        `No readable text could be extracted from "${file.originalname}".`,
      );
    }

    const cleaned = normalizeWhitespace(raw);
    return truncateText(cleaned, MAX_RAW_TEXT);
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) throw err;
    if (err instanceof FileParseError) throw err;
    const msg = err instanceof Error ? err.message : "Unknown extraction error";
    throw new FileParseError(
      `Could not parse "${file.originalname}": ${msg}`,
    );
  }
}

/**
 * Extract and concatenate text from multiple files belonging to one supplier.
 */
export async function extractMergedSupplierText(
  files: UploadedFileLike[],
): Promise<string> {
  const parts: string[] = [];
  for (const f of files) {
    const text = await extractTextFromFile(f);
    parts.push(`# File: ${f.originalname}\n\n${text}`);
  }
  return parts.join("\n\n---\n\n");
}
