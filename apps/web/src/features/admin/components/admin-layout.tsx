import type { AuthUser } from "@mbg/shared";
import {
  Apple,
  BarChart3,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogout } from "../hooks/use-auth";
import { getRoleLabel } from "../lib/role-label";

interface AdminLayoutProps {
  user: AuthUser;
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/menus/")) return "Editor Menu";
  if (pathname.startsWith("/admin/menus")) return "Menu Harian";
  if (pathname.startsWith("/admin/schools")) return "Sekolah & QR";
  if (pathname.startsWith("/admin/foods")) return "Bahan TKPI";
  if (pathname.startsWith("/admin/reports")) return "Laporan";
  if (pathname.startsWith("/admin/sppg")) return "Kelola SPPG";
  return "Dashboard Admin";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Responsive claymorphism admin workspace layout (sidebar + header + sign-out). */
export function AdminLayout({ user }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = useLogout();
  const { pathname } = useLocation();
  const roleLabel = getRoleLabel(user.role);
  const pageTitle = getPageTitle(pathname);
  const initials = getInitials(user.name) || "AD";

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navContent = (
    <div className="flex h-full flex-col justify-between gap-6 p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-2 px-1">
          <BrandLogo size="md" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu navigasi"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-sky-soft hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu dashboard admin" className="space-y-1.5">
          <NavLink
            to="/admin"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                  : "text-foreground hover:bg-sky-soft/80"
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/menus"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                  : "text-foreground hover:bg-sky-soft/80"
              }`
            }
          >
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Menu Harian</span>
          </NavLink>

          <NavLink
            to="/admin/schools"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                  : "text-foreground hover:bg-sky-soft/80"
              }`
            }
          >
            <School className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Sekolah &amp; QR</span>
          </NavLink>

          <NavLink
            to="/admin/foods"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                  : "text-foreground hover:bg-sky-soft/80"
              }`
            }
          >
            <Apple className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Bahan TKPI</span>
          </NavLink>

          <NavLink
            to="/admin/reports"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                  : "text-foreground hover:bg-sky-soft/80"
              }`
            }
          >
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Laporan</span>
          </NavLink>

          {user.role === "super_admin" && (
            <NavLink
              to="/admin/sppg"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                    : "text-foreground hover:bg-sky-soft/80"
                }`
              }
            >
              <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Kelola SPPG</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="clay-well flex items-center gap-3 p-3">
        <span className="clay-pill inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-bold text-foreground">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div data-surface="admin" className="flex min-h-screen bg-background text-foreground">
      <aside className="no-print hidden w-64 shrink-0 p-3 pr-0 lg:block">
        <div className="clay-card sticky top-3 h-[calc(100vh-1.5rem)] overflow-y-auto">
          {navContent}
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-[400] flex lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/40"
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            aria-label="Navigasi seluler admin"
            className="relative z-[401] m-2 w-72 max-w-[85vw] rounded-lg border-2 border-[var(--clay-rim)] bg-card shadow-[var(--shadow-clay-elevated)]"
          >
            {navContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-[200] px-4 pt-3 sm:px-6 lg:px-8">
          <div className="clay-card flex min-h-16 items-center justify-between gap-3 bg-card/95 px-4 py-2 backdrop-blur-xs sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                aria-expanded={mobileMenuOpen}
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md bg-sky-soft/70 text-foreground shadow-2xs hover:bg-sky-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <p className="truncate font-display text-lg font-bold leading-tight text-foreground">
                {pageTitle}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="max-w-44 truncate text-sm font-medium text-foreground">
                  {user.name}
                </span>
                <Badge variant="mint">{roleLabel}</Badge>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>{logoutMutation.isPending ? "Keluar…" : "Keluar"}</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
