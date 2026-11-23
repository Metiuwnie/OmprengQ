import type { AuthUser } from "@mbg/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import {
  requireAuth,
  requireRole,
  SESSION_COOKIE_NAME,
  signSessionToken,
  type AuthContextVariables,
} from "./auth.js";
import { errorHandler } from "./error.js";
import { createRateLimiter } from "./rate-limit.js";

function createProtectedTestApp() {
  return new Hono<{ Variables: AuthContextVariables }>()
    .onError(errorHandler)
    .get("/super-only", requireAuth, requireRole("super_admin"), (c) => {
      return c.json({ ok: true, user: c.get("user") });
    })
    .get("/sppg-or-super", requireAuth, requireRole("super_admin", "sppg_admin"), (c) => {
      return c.json({ ok: true, user: c.get("user") });
    });
}

describe("auth and RBAC middleware", () => {
  it("returns 401 when session cookie is absent or invalid", async () => {
    const testApp = createProtectedTestApp();

    const missingRes = await testApp.request("/super-only");
    expect(missingRes.status).toBe(401);
    await expect(missingRes.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });

    const invalidRes = await testApp.request("/super-only", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=bad.token.value` },
    });
    expect(invalidRes.status).toBe(401);
  });

  it("returns 403 when sppg_admin accesses a super_admin route", async () => {
    const testApp = createProtectedTestApp();
    const sppgAdmin: AuthUser = {
      id: "00000000-0000-4000-8000-000000000010",
      email: "sppg@omprengq.local",
      name: "Admin SPPG",
      role: "sppg_admin",
      sppgId: "00000000-0000-4000-8000-000000000001",
      schoolId: null,
    };
    const token = await signSessionToken(sppgAdmin);

    const forbiddenRes = await testApp.request("/super-only", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(forbiddenRes.status).toBe(403);
    await expect(forbiddenRes.json()).resolves.toMatchObject({
      error: { code: "FORBIDDEN" },
    });

    const allowedRes = await testApp.request("/sppg-or-super", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(allowedRes.status).toBe(200);
  });

  it("allows super_admin on super_admin routes", async () => {
    const testApp = createProtectedTestApp();
    const superAdmin: AuthUser = {
      id: "00000000-0000-4000-8000-000000000011",
      email: "super@omprengq.local",
      name: "Super Admin",
      role: "super_admin",
      sppgId: null,
      schoolId: null,
    };
    const token = await signSessionToken(superAdmin);

    const res = await testApp.request("/super-only", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      user: { role: "super_admin" },
    });
  });

  it("rate limits after maxAttempts and resets after window expires", async () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({
      maxAttempts: 3,
      windowMs: 60_000,
      now: () => now,
    });

    const limitedApp = new Hono()
      .post("/login", limiter, (c) => c.json({ ok: true }));

    for (let i = 0; i < 3; i += 1) {
      const res = await limitedApp.request("/login", {
        method: "POST",
        headers: { "x-forwarded-for": "10.0.0.1" },
      });
      expect(res.status).toBe(200);
    }

    const blocked = await limitedApp.request("/login", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED" },
    });

    now += 61_000;
    const recovered = await limitedApp.request("/login", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(recovered.status).toBe(200);
  });
});
