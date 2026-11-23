import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDb, getDb } from "../db/client.js";
import { runSeed } from "../db/seed/index.js";
import { ensureEnvLoaded } from "../lib/env.js";
import { SESSION_COOKIE_NAME } from "../middleware/auth.js";
import { errorHandler } from "../middleware/error.js";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { createAuthRoutes } from "./auth.js";

function extractCookieValue(setCookieHeader: string | null, cookieName: string): string | null {
  if (!setCookieHeader) return null;
  const pattern = new RegExp(`${cookieName}=([^;]+)`);
  return pattern.exec(setCookieHeader)?.[1] ?? null;
}

describe("auth routes (/api/auth)", () => {
  const testApp = new Hono()
    .basePath("/api")
    .onError(errorHandler)
    .route(
      "/auth",
      createAuthRoutes({
        loginRateLimiter: createRateLimiter({ maxAttempts: 20, windowMs: 60_000 }),
      }),
    );

  beforeAll(async () => {
    ensureEnvLoaded();
    await runSeed(getDb());
  });

  afterAll(async () => {
    await closeDb();
  });

  it("logs in with seeded credentials, sets httpOnly cookie, omits passwordHash, and supports /me + /logout", async () => {
    const email = process.env.SEED_SPPG_ADMIN_EMAIL ?? "";
    const password = process.env.SEED_SPPG_ADMIN_PASSWORD ?? "";

    const loginRes = await testApp.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie?.toLowerCase()).toContain("httponly");
    expect(setCookie?.toLowerCase()).toContain("samesite=lax");

    const loginBody = (await loginRes.json()) as { user: Record<string, unknown> };
    expect(loginBody.user).toMatchObject({
      email: email.toLowerCase(),
      role: "sppg_admin",
    });
    expect("passwordHash" in loginBody.user).toBe(false);
    expect(JSON.stringify(loginBody)).not.toContain(password);

    const token = extractCookieValue(setCookie, SESSION_COOKIE_NAME);
    expect(token).toBeTruthy();

    const meRes = await testApp.request("/api/auth/me", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as { user: Record<string, unknown> };
    expect(meBody.user).toMatchObject({
      email: email.toLowerCase(),
      role: "sppg_admin",
    });
    expect("passwordHash" in meBody.user).toBe(false);

    const logoutRes = await testApp.request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    expect(logoutRes.status).toBe(200);
    await expect(logoutRes.json()).resolves.toEqual({ ok: true });
    expect(logoutRes.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=;`);
  });

  it("rejects wrong password with 401 and uniform error format", async () => {
    const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "";

    const res = await testApp.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "kata-sandi-salah" }),
    });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Email atau kata sandi tidak sesuai.",
      },
    });
  });

  it("rejects unauthenticated GET /api/auth/me with 401", async () => {
    const res = await testApp.request("/api/auth/me");
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });
});
