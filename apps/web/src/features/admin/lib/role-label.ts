import type { Role } from "@mbg/shared";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  sppg_admin: "Admin SPPG",
  school_admin: "Admin Sekolah",
};

/** Return human-readable Indonesian label for an admin role. */
export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
