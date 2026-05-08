// Domain-level error classes that map cleanly to HTTP responses.
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_PARSE_ERROR"
  | "GEMINI_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = "INTERNAL_ERROR",
    status = 500,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class UnsupportedFileTypeError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "UNSUPPORTED_FILE_TYPE", 415, details);
  }
}

export class FileParseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "FILE_PARSE_ERROR", 422, details);
  }
}

export class GeminiError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "GEMINI_ERROR", 502, details);
  }
}

export function toErrorResponse(err: unknown): {
  status: number;
  body: {
    error: { message: string; code: ErrorCode; details?: Record<string, unknown> };
  };
} {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        error: {
          message: err.message,
          code: err.code,
          details: err.details ?? {},
        },
      },
    };
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return {
    status: 500,
    body: { error: { message, code: "INTERNAL_ERROR", details: {} } },
  };
}
