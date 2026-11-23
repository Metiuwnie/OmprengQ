import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password service", () => {
  it("hashes with argon2 and verifies matching password", async () => {
    const hash = await hashPassword("RahasiaOmprengQ!2026");
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(hash, "RahasiaOmprengQ!2026")).resolves.toBe(true);
  });

  it("rejects mismatched or malformed passwords/hashes safely", async () => {
    const hash = await hashPassword("SandiBenar123");
    await expect(verifyPassword(hash, "SandiSalah")).resolves.toBe(false);
    await expect(verifyPassword("not-a-valid-hash", "SandiBenar123")).resolves.toBe(false);
    await expect(verifyPassword(hash, "")).resolves.toBe(false);
  });
});
