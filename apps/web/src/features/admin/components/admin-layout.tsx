import type { AuthUser } from "@mbg/shared";
import {
  Apple,
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogout } from "../hooks/use-auth";
import { getRoleLabel } from "../lib/role-label";

interface AdminLayoutProps {
  user: AuthUser;
}

/** Responsive admin workspace layout (sidebar + header + sign-out) built for laptop and 360px mobile. */
export function AdminLayout({ user }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoutMutation = useLogout();
  const roleLabel = getRoleLabel(user.role);

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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Utensils className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-none text-foreground">OmprengQ</p>
              <p className="mt-1 text-xs text-muted-foreground">Panel Pengelola</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Tutup menu navigasi"
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Menu dasbor admin" className="space-y-1.5">
          <NavLink
            to="/admin"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Ringkasan</span>
          </NavLink>

          <div className="pt-4">
            <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">
              Modul berikutnya (M2)
            </p>
            <ul className="space-y-1">
              <li className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Menu Harian</span>
              </li>
              <li className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
                <School className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Sekolah &amp; QR</span>
              </li>
              <li className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
                <Apple className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Bahan TKPI</span>
              </li>
              {user.role === "super_admin" && (
                <li className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Kelola SPPG</span>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-border pt-4">
        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-2">
          <Badge variant="mint">{roleLabel}</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        {navContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[400] flex lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/40"
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            aria-label="Navigasi seluler admin"
            className="relative z-[401] w-72 max-w-[85vw] border-r border-border bg-card shadow-lg"
          >
            {navContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[200] border-b border-border bg-card/95 backdrop-blur-xs">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                aria-expanded={mobileMenuOpen}
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold leading-tight text-foreground">
                  Dasbor Admin
                </p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  Operasional Menu &amp; Data Gizi MBG
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="max-w-44 truncate text-sm font-medium text-foreground">
                  {user.name}
                </span>
                <Badge variant="default">{roleLabel}</Badge>
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
