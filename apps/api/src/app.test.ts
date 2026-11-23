import { describe, expect, it } from "vitest";
import app from "./app.js";

describe("GET /api/health", () => {
  it("returns ok: true", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
