import { describe, expect, it } from "vitest";
import { getRoleLabel } from "./role-label";

describe("getRoleLabel", () => {
  it("maps every admin role to Indonesian display text", () => {
    expect(getRoleLabel("super_admin")).toBe("Super Admin");
    expect(getRoleLabel("sppg_admin")).toBe("Admin SPPG");
    expect(getRoleLabel("school_admin")).toBe("Admin Sekolah");
  });
});
