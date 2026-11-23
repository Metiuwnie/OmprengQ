import { authUserSchema, type AuthUser, type Role } from "@mbg/shared";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { getJwtSecret } from "../lib/env.js";
import { AppError } from "./error.js";

export const SESSION_COOKIE_NAME = "omprengq_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AuthContextVariables {
  user: AuthUser;
}

/** Sign an HS256 JWT carrying only non-sensitive admin session claims. */
export async function signSessionToken(user: AuthUser): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sppgId: user.sppgId,
      schoolId: user.schoolId,
      iat: nowSec,
      exp: nowSec + SESSION_TTL_SECONDS,
    },
    getJwtSecret(),
    "HS256",
  );
}

/** Verify an HS256 session JWT and parse it into `AuthUser`. */
export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = await verify(token, getJwtSecret(), "HS256");
    const parsed = authUserSchema.safeParse({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      sppgId: payload.sppgId ?? null,
      schoolId: payload.schoolId ?? null,
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Require a valid httpOnly JWT session cookie and attach `c.get("user")`. */
export const requireAuth: MiddlewareHandler<{ Variables: AuthContextVariables }> = async (
  c,
  next,
) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Silakan masuk terlebih dahulu.");
  }

  const user = await verifySessionToken(token);
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Sesi Anda telah berakhir. Silakan masuk kembali.");
  }

  c.set("user", user);
  await next();
};

/** Require the authenticated user to hold one of the permitted roles. */
export function requireRole(
  ...allowedRoles: Role[]
): MiddlewareHandler<{ Variables: AuthContextVariables }> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Silakan masuk terlebih dahulu.");
    }
    if (!allowedRoles.includes(user.role)) {
      throw new AppError(403, "FORBIDDEN", "Anda tidak memiliki akses ke fitur ini.");
    }
    await next();
  };
}
