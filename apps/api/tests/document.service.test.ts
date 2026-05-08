import { describe, expect, it } from "vitest";
import { extractTextFromFile } from "../src/services/document.service";
import { normalizeWhitespace, truncateText } from "../src/utils/text";

describe("text utils", () => {
  it("normalizeWhitespace collapses spaces and blank lines", () => {
    const input = "Hello   world\r\n\r\n\r\n\r\nNext   paragraph\t\there.";
    const out = normalizeWhitespace(input);
    expect(out).toContain("Hello world");
    expect(out).not.toContain("    ");
    expect(out.split("\n\n").length).toBeGreaterThanOrEqual(2);
  });

  it("truncateText returns text unchanged when shorter than max", () => {
    const t = "short text";
    expect(truncateText(t, 100)).toBe(t);
  });

  it("truncateText shortens long text", () => {
    const t = "a".repeat(5000) + " requirement section " + "b".repeat(5000);
    const out = truncateText(t, 1000);
    expect(out.length).toBeLessThanOrEqual(1200);
  });
});

describe("document.service", () => {
  it("extracts text from a TXT buffer", async () => {
    const buf = Buffer.from("Hello procurement world.\nLine 2.", "utf-8");
    const text = await extractTextFromFile({
      originalname: "sample.txt",
      mimetype: "text/plain",
      buffer: buf,
      size: buf.length,
    });
    expect(text).toContain("Hello procurement world.");
  });

  it("rejects unsupported file types", async () => {
    await expect(
      extractTextFromFile({
        originalname: "image.png",
        mimetype: "image/png",
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        size: 4,
      }),
    ).rejects.toThrowError();
  });

  it("throws useful error on empty text content", async () => {
    await expect(
      extractTextFromFile({
        originalname: "empty.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("   \n\n", "utf-8"),
        size: 5,
      }),
    ).rejects.toThrowError(/No readable text/);
  });
});
