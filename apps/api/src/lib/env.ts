import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

let envLoaded = false;

/** Load root `.env` once regardless of whether command runs from root or `apps/api`. */
export function ensureEnvLoaded(): void {
  if (envLoaded) return;
  envLoaded = true;

  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(currentDir, "../../../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      loadEnv({ path: candidate });
      break;
    }
  }
}

export function getDatabaseUrl(): string {
  ensureEnvLoaded();
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return url;
}

export function getJwtSecret(): string {
  ensureEnvLoaded();
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "test") {
      return "test-only-jwt-secret-omprengq";
    }
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

export function isCookieSecure(): boolean {
  ensureEnvLoaded();
  return process.env.COOKIE_SECURE === "true";
}

export function getAppBaseUrl(): string {
  ensureEnvLoaded();
  return (process.env.APP_BASE_URL?.trim() || "http://localhost:5173").replace(/\/+$/, "");
}
