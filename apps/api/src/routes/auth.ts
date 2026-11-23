import { zValidator } from "@hono/zod-validator";
import { loginInputSchema, type AuthUser } from "@mbg/shared";
import { eq } from "drizzle-orm";
import { Hono, type MiddlewareHandler } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { getDb, type AppDatabase } from "../db/client.js";
import { users } from "../db/schema/index.js";
import { isCookieSecure } from "../lib/env.js";
import {
  requireAuth,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
  type AuthContextVariables,
} from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { verifyPassword } from "../services/password.js";

interface CreateAuthRoutesOptions {
  getDatabase?: () => AppDatabase;
  loginRateLimiter?: MiddlewareHandler;
}

/** Build `/api/auth` routes with injectable database/rate limiter for unit & integration testing. */
export function createAuthRoutes(options: CreateAuthRoutesOptions = {}) {
  const resolveDb = options.getDatabase ?? getDb;
  const loginLimiter =
    options.loginRateLimiter ?? createRateLimiter({ maxAttempts: 5, windowMs: 60_000 });

  return new Hono<{ Variables: AuthContextVariables }>()
    .post(
      "/login",
      loginLimiter,
      zValidator("json", loginInputSchema, (result, c) => {
        if (!result.success) {
          const message = result.error.issues[0]?.message ?? "Data masuk tidak valid.";
          return c.json({ error: { code: "VALIDATION_ERROR", message } }, 400);
        }
      }),
      async (c) => {
        const { email, password } = c.req.valid("json");
        const normalizedEmail = email.trim().toLowerCase();
        const database = resolveDb();

        const rows = await database
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        const account = rows[0];
        if (!account || !(await verifyPassword(account.passwordHash, password))) {
          throw new AppError(
            401,
            "INVALID_CREDENTIALS",
            "Email atau kata sandi tidak sesuai.",
          );
        }

        const safeUser: AuthUser = {
          id: account.id,
          email: account.email,
          name: account.name,
          role: account.role,
          sppgId: account.sppgId ?? null,
          schoolId: account.schoolId ?? null,
        };

        const token = await signSessionToken(safeUser);
        setCookie(c, SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: "Lax",
          secure: isCookieSecure(),
          path: "/",
          maxAge: SESSION_TTL_SECONDS,
        });

        return c.json({ user: safeUser });
      },
    )
    .post("/logout", (c) => {
      deleteCookie(c, SESSION_COOKIE_NAME, {
        path: "/",
      });
      return c.json({ ok: true as const });
    })
    .get("/me", requireAuth, async (c) => {
      const sessionUser = c.get("user");
      const database = resolveDb();

      const rows = await database
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          sppgId: users.sppgId,
          schoolId: users.schoolId,
        })
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);

      const user = rows[0];
      if (!user) {
        throw new AppError(401, "UNAUTHORIZED", "Akun tidak ditemukan.");
      }

      return c.json({
        user: {
          ...user,
          sppgId: user.sppgId ?? null,
          schoolId: user.schoolId ?? null,
        } satisfies AuthUser,
      });
    });
}
