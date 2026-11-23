import { describe, expect, it } from "vitest";
import { cn } from "./utils.js";

describe("cn utility", () => {
  it("merges conflicting Tailwind utility classes cleanly", () => {
    expect(cn("px-2 py-2", "px-4")).toBe("py-2 px-4");
  });
});
