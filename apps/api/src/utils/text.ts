// Reusable text helpers used during document extraction and prompt building.

/**
 * Collapse repeating whitespace while preserving paragraph breaks.
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n?/g, "\n")
    // collapse runs of spaces/tabs
    .replace(/[ \t\f\v]+/g, " ")
    // collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Truncate text intelligently. Tries to keep the beginning, an excerpt of
 * the middle (covering common procurement sections), and the conclusion.
 */
export function truncateText(text: string, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;

  const headSize = Math.floor(maxChars * 0.55);
  const tailSize = Math.floor(maxChars * 0.2);
  const middleSize = maxChars - headSize - tailSize - 80; // 80 chars for separators

  const head = text.slice(0, headSize);
  const tail = text.slice(text.length - tailSize);

  // Try to extract a relevant middle slice covering procurement keywords
  const sectionKeywords = [
    "requirement",
    "scope",
    "deliverable",
    "award criteria",
    "evaluation",
    "price",
    "cost",
    "value",
    "compliance",
    "specification",
    "timeline",
    "warranty",
  ];

  let middle = "";
  for (const kw of sectionKeywords) {
    const idx = text.toLowerCase().indexOf(kw, headSize);
    if (idx !== -1 && idx < text.length - tailSize) {
      const slice = text.slice(idx, Math.min(idx + middleSize, text.length - tailSize));
      if (slice.length > middle.length) {
        middle = slice;
        if (middle.length >= middleSize) break;
      }
    }
  }
  if (middle.length > middleSize) middle = middle.slice(0, middleSize);

  return [
    head,
    "\n\n[...truncated for length...]\n\n",
    middle,
    "\n\n[...truncated for length...]\n\n",
    tail,
  ].join("");
}

/**
 * Find rough price candidates (numbers next to currency tokens or symbols).
 */
export function extractPossiblePrices(text: string): string[] {
  if (!text) return [];
  const out = new Set<string>();
  const re =
    /(?:€|\$|£|EUR|USD|GBP)\s?\d{1,3}(?:[,. ]\d{3})*(?:[.,]\d+)?|\d{1,3}(?:[,. ]\d{3})*(?:[.,]\d+)?\s?(?:€|\$|£|EUR|USD|GBP)/gi;
  for (const m of text.matchAll(re)) out.add(m[0].trim());
  return Array.from(out).slice(0, 30);
}

/**
 * Find rough date candidates.
 */
export function extractPossibleDates(text: string): string[] {
  if (!text) return [];
  const out = new Set<string>();
  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{2}\/\d{2}\/\d{4}\b/g,
    /\b\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}\b/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) out.add(m[0]);
  }
  return Array.from(out).slice(0, 30);
}

/**
 * Split a string into chunks of approximately the given size.
 */
export function chunkText(text: string, chunkSize: number): string[] {
  if (!text) return [];
  if (chunkSize <= 0) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Sanitize an uploaded file name (strip path elements and odd characters).
 */
export function sanitizeFileName(name: string): string {
  if (!name) return "file";
  const base = name.replace(/[\\/]/g, "_").replace(/[^a-zA-Z0-9._\- ]/g, "_");
  return base.slice(0, 200);
}
