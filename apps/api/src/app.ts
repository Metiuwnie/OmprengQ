import { Hono } from "hono";
import type { HealthResponse } from "@mbg/shared";

const app = new Hono().basePath("/api").get("/health", (c) => {
  const payload: HealthResponse = { ok: true };
  return c.json(payload);
});

export type AppType = typeof app;
export default app;
