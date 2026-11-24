import type { AuthUser } from "@mbg/shared";
import { AppError } from "../middleware/error.js";

/**
 * Resolve which SPPG a request operates on. `sppg_admin` is always locked to the SPPG in the JWT
 * (a client-supplied id is ignored). `super_admin` must name the SPPG explicitly.
 */
export function resolveTargetSppgId(user: AuthUser, requestedSppgId?: string | null): string {
  if (user.role === "super_admin") {
    if (!requestedSppgId) {
      throw new AppError(400, "SPPG_REQUIRED", "Pilih SPPG terlebih dahulu.");
    }
    return requestedSppgId;
  }
  if (!user.sppgId) {
    throw new AppError(403, "FORBIDDEN", "Akun Anda belum terhubung ke SPPG.");
  }
  return user.sppgId;
}

/** SPPG an actor may read: `super_admin` may optionally filter, everyone else is locked to their own. */
export function resolveReadableSppgId(user: AuthUser, requestedSppgId?: string | null): string | null {
  if (user.role === "super_admin") {
    return requestedSppgId ?? null;
  }
  if (!user.sppgId) {
    throw new AppError(403, "FORBIDDEN", "Akun Anda belum terhubung ke SPPG.");
  }
  return user.sppgId;
}

/** Throw 404 unless the actor may access a resource owned by `resourceSppgId` (and school, if scoped). */
export function assertTenantAccess(
  user: AuthUser,
  resourceSppgId: string,
  resourceSchoolId?: string,
): void {
  if (user.role === "super_admin") return;
  if (user.sppgId !== resourceSppgId) {
    throw new AppError(404, "NOT_FOUND", "Data tidak ditemukan.");
  }
  if (user.role === "school_admin" && resourceSchoolId !== undefined && user.schoolId !== resourceSchoolId) {
    throw new AppError(404, "NOT_FOUND", "Data tidak ditemukan.");
  }
}

/** Map MySQL duplicate-key / FK errors raised by mysql2 into friendly 409 AppErrors. */
export function mapDbError(error: unknown, messages: { duplicate?: string; referenced?: string }): never {
  const cause = (error as { cause?: unknown })?.cause ?? error;
  const code = (cause as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") {
    throw new AppError(409, "DUPLICATE", messages.duplicate ?? "Data sudah ada.");
  }
  if (code === "ER_ROW_IS_REFERENCED_2" || code === "ER_ROW_IS_REFERENCED") {
    throw new AppError(409, "IN_USE", messages.referenced ?? "Data masih dipakai oleh data lain.");
  }
  if (code === "ER_NO_REFERENCED_ROW_2" || code === "ER_NO_REFERENCED_ROW") {
    throw new AppError(400, "INVALID_REFERENCE", "Data acuan (misalnya SPPG) tidak ditemukan.");
  }
  throw error;
}
