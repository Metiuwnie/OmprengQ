import { describe, expect, it } from "vitest";
import app from "../app.js";

describe("securityHeaders middleware (M8)", () => {
  it("sets baseline security headers on API responses", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("permissions-policy")).toContain("camera=()");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
  });
});
