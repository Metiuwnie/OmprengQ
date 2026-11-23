import type { HealthResponse } from "@mbg/shared";
import { Hono } from "hono";
import { errorHandler } from "./middleware/error.js";
import { createAuthRoutes } from "./routes/auth.js";

const app = new Hono()
  .basePath("/api")
  .onError(errorHandler)
  .get("/health", (c) => {
    const payload: HealthResponse = { ok: true };
    return c.json(payload);
  })
  .route("/auth", createAuthRoutes());

export type AppType = typeof app;
export default app;
