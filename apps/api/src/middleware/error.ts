import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";

/** Application error carrying HTTP status and machine-readable code. */
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

/** Format consistent `{ error: { code, message } }` JSON responses without leaking sensitive data. */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Data masukan tidak valid.",
        },
      },
      400,
    );
  }

  console.error("[api:error]", err instanceof Error ? err.message : "Unknown error");
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server.",
      },
    },
    500,
  );
};
