import type { Context, ValidationTargets } from "hono";

interface FailedResult {
  success: false;
  error: { issues: ReadonlyArray<{ message: string }> };
}

/** Shared zod-validator hook that returns the uniform `{ error: { code, message } }` 400 body. */
export function zodErrorHook(
  result: { success: true } | FailedResult,
  c: Context,
) {
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Data masukan tidak valid.";
    return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
  return undefined;
}

export type ValidationTarget = keyof ValidationTargets;
