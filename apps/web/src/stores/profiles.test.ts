import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createSafeProfileStorage,
  PROFILE_STORAGE_KEY,
  sanitizePersistedProfileState,
  useProfileStore,
} from "./profiles";

describe("local profiles store (M4)", () => {
  beforeEach(() => {
    useProfileStore.getState().resetProfiles();
  });

  it("supports creating >= 3 profiles, switching active, updating, and removing", () => {
    const store = useProfileStore.getState();

    const p1 = store.addProfile({
      nickname: "Budi",
      age: 8,
      sex: "male",
      weightKg: 25,
      heightCm: 128,
      activity: "moderate",
      allergies: ["telur"],
      dislikes: [],
      level: "sd_low",
    });
    const p2 = store.addProfile({
      nickname: "Sari",
      age: 14,
      sex: "female",
      weightKg: 45,
      heightCm: 155,
      activity: "moderate",
      allergies: [],
      dislikes: ["pare"],
      level: "smp",
    });
    const p3 = store.addProfile({
      nickname: "Raka",
      age: 17,
      sex: "male",
      weightKg: 60,
      heightCm: 170,
      activity: "active",
      allergies: ["udang"],
      dislikes: [],
      level: "sma",
    });

    expect(useProfileStore.getState().profiles).toHaveLength(3);
    expect(useProfileStore.getState().activeId).toBe(p3.id);

    useProfileStore.getState().setActive(p1.id);
    expect(useProfileStore.getState().activeId).toBe(p1.id);

    const updated = useProfileStore.getState().updateProfile(p2.id, { weightKg: 47 });
    expect(updated?.weightKg).toBe(47);

    useProfileStore.getState().removeProfile(p1.id);
    expect(useProfileStore.getState().profiles).toHaveLength(2);
    expect(useProfileStore.getState().activeId).toBe(p2.id);
  });

  it("export -> reset -> import restores identical profiles and rejects broken JSON", () => {
    const store = useProfileStore.getState();
    store.addProfile({
      nickname: "Ayu",
      age: 10,
      sex: "female",
      weightKg: 32,
      heightCm: 138,
      activity: "light",
      allergies: ["kacang"],
      dislikes: ["bayam"],
      level: "sd_high",
    });

    const snapshotBefore = useProfileStore.getState().profiles;
    const exported = useProfileStore.getState().exportProfilesJson();

    useProfileStore.getState().resetProfiles();
    expect(useProfileStore.getState().profiles).toHaveLength(0);

    const badJson = useProfileStore.getState().importProfilesJson("{broken");
    expect(badJson.ok).toBe(false);

    const badSchema = useProfileStore
      .getState()
      .importProfilesJson(JSON.stringify({ schemaVersion: 99, profiles: [] }));
    expect(badSchema.ok).toBe(false);

    const imported = useProfileStore.getState().importProfilesJson(exported);
    expect(imported).toEqual({ ok: true, count: 1 });
    expect(useProfileStore.getState().profiles).toEqual(snapshotBefore);
  });

  it("safely sanitizes corrupted persisted data without throwing", () => {
    expect(sanitizePersistedProfileState(null)).toEqual({
      profiles: [],
      activeId: null,
      schemaVersion: 1,
    });
    expect(
      sanitizePersistedProfileState({
        profiles: [{ bad: true }],
        activeId: "missing",
        schemaVersion: 1,
      }),
    ).toEqual({
      profiles: [],
      activeId: null,
      schemaVersion: 1,
    });
  });

  it("falls back to memory storage when localStorage is unavailable", () => {
    let unavailableCalled = false;
    const storage = createSafeProfileStorage(() => {
      unavailableCalled = true;
    });
    // In Node vitest environment, window/localStorage is undefined -> triggers fallback
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ test: true }));
    expect(unavailableCalled).toBe(true);
    expect(storage.getItem(PROFILE_STORAGE_KEY)).toBe(JSON.stringify({ test: true }));
    storage.removeItem(PROFILE_STORAGE_KEY);
    expect(storage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
  });

  it("privacy rule: stores/profiles.ts never imports API client or calls fetch", () => {
    const source = readFileSync(resolve(process.cwd(), "src/stores/profiles.ts"), "utf8");
    expect(source).not.toMatch(/from\s+["']@\/lib\/api["']/);
    expect(source).not.toMatch(/from\s+["'].*\/api\//);
    expect(source).not.toMatch(/hono\/client/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });
});
