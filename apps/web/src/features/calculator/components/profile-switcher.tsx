import type { ChildProfile } from "@mbg/shared";
import { UserCog, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { LEVEL_SHORT_LABELS } from "@/features/admin/lib/labels";

interface ProfileSwitcherProps {
  profiles: readonly ChildProfile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  schoolSlug?: string | null;
  isChildMode?: boolean;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A"
  );
}

/** Multi-child local profile chip bar with parent profile management link. */
export function ProfileSwitcher({
  profiles,
  activeId,
  onSelect,
  schoolSlug,
  isChildMode = false,
}: ProfileSwitcherProps) {
  const manageUrl = schoolSlug
    ? `/kalkulator/profil?school=${encodeURIComponent(schoolSlug)}`
    : "/kalkulator/profil";

  return (
    <div className="clay-card flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5">
        <span className="hidden items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          Profil:
        </span>

        <div role="group" aria-label="Pilih profil anak" className="flex items-center gap-2">
          {profiles.map((profile) => {
            const active = profile.id === activeId;
            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(profile.id)}
                className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-clay-primary)]"
                    : "border-border bg-background text-foreground hover:bg-sky-soft/70"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-mint-soft text-foreground"
                  }`}
                >
                  {getInitials(profile.nickname)}
                </span>
                <span>{profile.nickname}</span>
                <span
                  className={`text-xs ${
                    active ? "text-primary-foreground/85" : "text-muted-foreground"
                  }`}
                >
                  {LEVEL_SHORT_LABELS[profile.level]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Link
        to={manageUrl}
        className="clay-pill inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-background px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
      >
        <UserCog className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{isChildMode ? "Untuk orang tua" : "Kelola Profil"}</span>
      </Link>
    </div>
  );
}
