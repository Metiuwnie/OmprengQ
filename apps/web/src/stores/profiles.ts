import {
  ChildProfileInputSchema,
  ChildProfileSchema,
  validateProfileExport,
  type ChildProfile,
  type ChildProfileInput,
  type ProfileExportPayload,
} from "@mbg/shared";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export const PROFILE_STORAGE_KEY = "mbg.profiles.v1";

export type ProfileState = {
  profiles: ChildProfile[];
  activeId: string | null;
  schemaVersion: 1;
};

export interface ProfileStore extends ProfileState {
  /** True when localStorage is unavailable/full and state falls back to memory. */
  storageUnavailable: boolean;
  addProfile: (input: ChildProfileInput) => ChildProfile;
  updateProfile: (id: string, patch: Partial<ChildProfileInput>) => ChildProfile | null;
  removeProfile: (id: string) => void;
  setActive: (id: string | null) => void;
  exportProfilesJson: () => string;
  importProfilesJson: (
    rawJson: string,
  ) => { ok: true; count: number } | { ok: false; error: string };
  resetProfiles: () => void;
}

const DEFAULT_PERSISTED_STATE: ProfileState = {
  profiles: [],
  activeId: null,
  schemaVersion: 1,
};

function generateLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Validate and sanitize unknown persisted state; safely resets if corrupted. */
export function sanitizePersistedProfileState(raw: unknown): ProfileState {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PERSISTED_STATE };
  }
  const candidate = raw as Record<string, unknown>;
  const rawProfiles = Array.isArray(candidate.profiles) ? candidate.profiles : [];
  const validProfiles: ChildProfile[] = [];
  const seenIds = new Set<string>();

  for (const entry of rawProfiles) {
    const parsed = ChildProfileSchema.safeParse(entry);
    if (parsed.success && !seenIds.has(parsed.data.id)) {
      seenIds.add(parsed.data.id);
      validProfiles.push(parsed.data);
    }
  }

  const rawActiveId = typeof candidate.activeId === "string" ? candidate.activeId : null;
  const activeId =
    rawActiveId && seenIds.has(rawActiveId) ? rawActiveId : (validProfiles[0]?.id ?? null);

  return {
    profiles: validProfiles,
    activeId,
    schemaVersion: 1,
  };
}

let storageFallbackTriggered = false;
const memoryFallback = new Map<string, string>();

function markStorageUnavailable(onUnavailable?: () => void) {
  storageFallbackTriggered = true;
  onUnavailable?.();
}

function getBrowserLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probeKey = "__mbg_storage_probe__";
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Storage wrapper that gracefully falls back to in-memory storage when localStorage is
 * blocked (private mode / quota exceeded) and safely resets corrupted JSON values.
 */
export function createSafeProfileStorage(onUnavailable?: () => void): StateStorage {
  return {
    getItem: (name: string): string | null => {
      const storage = getBrowserLocalStorage();
      if (!storage) {
        markStorageUnavailable(onUnavailable);
        return memoryFallback.get(name) ?? null;
      }
      try {
        const value = storage.getItem(name);
        if (value === null) return null;
        // Verify JSON integrity; if corrupted, reset safely instead of crashing.
        JSON.parse(value);
        return value;
      } catch {
        try {
          storage.removeItem(name);
        } catch {
          markStorageUnavailable(onUnavailable);
        }
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      const storage = getBrowserLocalStorage();
      if (!storage) {
        markStorageUnavailable(onUnavailable);
        memoryFallback.set(name, value);
        return;
      }
      try {
        storage.setItem(name, value);
      } catch {
        markStorageUnavailable(onUnavailable);
        memoryFallback.set(name, value);
      }
    },
    removeItem: (name: string): void => {
      memoryFallback.delete(name);
      const storage = getBrowserLocalStorage();
      if (!storage) {
        markStorageUnavailable(onUnavailable);
        return;
      }
      try {
        storage.removeItem(name);
      } catch {
        markStorageUnavailable(onUnavailable);
      }
    },
  };
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PERSISTED_STATE,
      storageUnavailable: storageFallbackTriggered,

      addProfile: (input) => {
        const validated = ChildProfileInputSchema.parse(input);
        const now = new Date().toISOString();
        const created: ChildProfile = ChildProfileSchema.parse({
          ...validated,
          id: generateLocalId(),
          createdAt: now,
          updatedAt: now,
        });

        set((state) => ({
          profiles: [...state.profiles, created],
          activeId: created.id,
        }));
        return created;
      },

      updateProfile: (id, patch) => {
        const existing = get().profiles.find((p) => p.id === id);
        if (!existing) return null;

        const updated: ChildProfile = ChildProfileSchema.parse({
          ...existing,
          ...patch,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        });

        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? updated : p)),
        }));
        return updated;
      },

      removeProfile: (id) => {
        set((state) => {
          const remaining = state.profiles.filter((p) => p.id !== id);
          const nextActiveId =
            state.activeId === id ? (remaining[0]?.id ?? null) : state.activeId;
          return {
            profiles: remaining,
            activeId: nextActiveId,
          };
        });
      },

      setActive: (id) => {
        if (id === null) {
          set({ activeId: null });
          return;
        }
        const exists = get().profiles.some((p) => p.id === id);
        if (exists) {
          set({ activeId: id });
        }
      },

      exportProfilesJson: () => {
        const { profiles, activeId, schemaVersion } = get();
        const payload: ProfileExportPayload = {
          schemaVersion,
          activeId,
          profiles,
        };
        return JSON.stringify(payload, null, 2);
      },

      importProfilesJson: (rawJson) => {
        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(rawJson);
        } catch {
          return { ok: false, error: "File JSON tidak valid atau rusak." };
        }

        const validated = validateProfileExport(parsedJson);
        if (!validated.success) {
          return {
            ok: false,
            error: "Format profil tidak sesuai skema OmprengQ (schemaVersion: 1).",
          };
        }

        const sanitized = sanitizePersistedProfileState(validated.data);
        set({
          profiles: sanitized.profiles,
          activeId: sanitized.activeId,
          schemaVersion: 1,
        });
        return { ok: true, count: sanitized.profiles.length };
      },

      resetProfiles: () => {
        set({
          profiles: [],
          activeId: null,
          schemaVersion: 1,
        });
      },
    }),
    {
      name: PROFILE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() =>
        createSafeProfileStorage(() => {
          if (!useProfileStore.getState().storageUnavailable) {
            queueMicrotask(() => {
              if (!useProfileStore.getState().storageUnavailable) {
                useProfileStore.setState({ storageUnavailable: true });
              }
            });
          }
        }),
      ),
      partialize: (state): ProfileState => ({
        profiles: state.profiles,
        activeId: state.activeId,
        schemaVersion: state.schemaVersion,
      }),
      migrate: (persistedState: unknown, _version: number): ProfileState => {
        void _version;
        return sanitizePersistedProfileState(persistedState);
      },
    },
  ),
);

/** Trigger a local browser download of `profil-gizi.json` (never uploads anywhere). */
export function downloadProfilesBackup(jsonContent: string): void {
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "profil-gizi.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
