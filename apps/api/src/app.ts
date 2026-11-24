import type { HealthResponse } from "@mbg/shared";
import { Hono } from "hono";
import { errorHandler } from "./middleware/error.js";
import { foodRoutes } from "./routes/admin/foods.js";
import { menuRoutes } from "./routes/admin/menus.js";
import { schoolRoutes } from "./routes/admin/schools.js";
import { sppgRoutes } from "./routes/admin/sppg.js";
import { createAuthRoutes } from "./routes/auth.js";
import { publicRoutes } from "./routes/public.js";

const app = new Hono()
  .basePath("/api")
  .onError(errorHandler)
  .get("/health", (c) => {
    const payload: HealthResponse = { ok: true };
    return c.json(payload);
  })
  .route("/auth", createAuthRoutes())
  .route("/public", publicRoutes)
  .route("/admin/sppg", sppgRoutes)
  .route("/admin/schools", schoolRoutes)
  .route("/admin/foods", foodRoutes)
  .route("/admin/menus", menuRoutes);

export type AppType = typeof app;
export default app;
