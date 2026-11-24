import { zodResolver } from "@hookform/resolvers/zod";
import { createMenuSchema, type AuthUser, type CreateMenuInput } from "@mbg/shared";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Utensils,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMenuMutation, useMenusQuery, useSppgList } from "../features/admin/hooks/use-menus";
import {
  formatDateId,
  formatMonthYearId,
  getMonthCalendarCells,
  getWeekDates,
  shiftIsoDate,
  toIsoDate,
} from "../features/admin/lib/labels";

type ViewMode = "week" | "month";

/** Admin daily menu calendar (weekly/monthly) + inline menu creation. */
export function AdminMenusPage() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const navigate = useNavigate();
  const isSuperAdmin = user.role === "super_admin";

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState<string>(() => toIsoDate());
  const [selectedSppgId, setSelectedSppgId] = useState<string>(user.sppgId ?? "");
  const [createForDate, setCreateForDate] = useState<string | null>(null);

  const sppgQuery = useSppgList(isSuperAdmin);
  const sppgOptions = sppgQuery.data?.sppg;
  const activeSppgId = isSuperAdmin ? selectedSppgId || sppgOptions?.[0]?.id || "" : (user.sppgId ?? "");

  const [anchorYear, anchorMonth] = useMemo(() => {
    const [y = 2026, m = 1] = anchorDate.split("-").map(Number);
    return [y, m - 1] as const;
  }, [anchorDate]);

  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);
  const monthCells = useMemo(
    () => getMonthCalendarCells(anchorYear, anchorMonth),
    [anchorYear, anchorMonth],
  );

  const rangeFrom = viewMode === "week" ? (weekDates[0] ?? anchorDate) : (monthCells[0]?.iso ?? anchorDate);
  const rangeTo =
    viewMode === "week"
      ? (weekDates[6] ?? anchorDate)
      : (monthCells[monthCells.length - 1]?.iso ?? anchorDate);

  const menusQuery = useMenusQuery({
    from: rangeFrom,
    to: rangeTo,
    sppgId: isSuperAdmin ? activeSppgId || undefined : undefined,
    enabled: !isSuperAdmin || Boolean(activeSppgId),
  });

  const menuRows = menusQuery.data?.menus;
  const menusByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof menuRows>[number]>();
    for (const menu of menuRows ?? []) {
      map.set(menu.date, menu);
    }
    return map;
  }, [menuRows]);

  const createMutation = useCreateMenuMutation();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMenuInput>({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      date: anchorDate,
      name: "",
      description: "",
      photoUrl: "",
      funFact: "",
    },
  });

  const openCreateForm = (date: string) => {
    reset({
      sppgId: isSuperAdmin ? activeSppgId : undefined,
      date,
      name: "",
      description: "",
      photoUrl: "",
      funFact: "",
    });
    setValue("date", date);
    setCreateForDate(date);
  };

  const handleStep = (direction: -1 | 1) => {
    if (viewMode === "week") {
      setAnchorDate((prev) => shiftIsoDate(prev, direction * 7));
      return;
    }
    const nextMonth = new Date(Date.UTC(anchorYear, anchorMonth + direction, 1));
    setAnchorDate(toIsoDate(new Date(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), 1)));
  };

  const onSubmitCreate = async (values: CreateMenuInput) => {
    const created = await createMutation.mutateAsync({
      ...values,
      sppgId: isSuperAdmin ? activeSppgId : undefined,
    });
    navigate(`/admin/menus/${created.menu.id}`);
  };

  const canCreate = user.role === "super_admin" || user.role === "sppg_admin";
  const todayIso = toIsoDate();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Menu Harian MBG</h1>
          <p className="text-sm text-muted-foreground">
            Jadwal satu menu per tanggal per SPPG. Klik tanggal untuk menyusun bahan dan melihat
            perkiraan gizi TKPI.
          </p>
        </div>
        {canCreate && (
          <Button
            type="button"
            variant="primary"
            disabled={isSuperAdmin && !activeSppgId}
            onClick={() => openCreateForm(anchorDate)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Buat Menu
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
          <div className="w-full max-w-sm space-y-1.5">
            <Label htmlFor="sppg-filter">SPPG yang dikelola</Label>
            <select
              id="sppg-filter"
              value={activeSppgId}
              onChange={(event) => {
                setSelectedSppgId(event.target.value);
                setCreateForDate(null);
              }}
              className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
            >
              {(sppgOptions ?? []).length === 0 && <option value="">Memuat daftar SPPG…</option>}
              {(sppgOptions ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.region ? ` (${item.region})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {createForDate && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Buat Menu Baru</CardTitle>
                <CardDescription>
                  Menu baru berstatus draf sampai Anda menambahkan bahan dan mempublikasikannya.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setCreateForDate(null)}
                aria-label="Tutup form buat menu"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {createMutation.isError && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {createMutation.error.message}
              </p>
            )}
            <form onSubmit={handleSubmit(onSubmitCreate)} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-date">Tanggal penyajian</Label>
                <Input
                  id="create-date"
                  type="date"
                  aria-invalid={errors.date ? "true" : "false"}
                  {...register("date")}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-name">Nama menu ringkas</Label>
                <Input
                  id="create-name"
                  placeholder="Mis. Nasi, Ayam Goreng, Sayur Bayam, Pisang"
                  aria-invalid={errors.name ? "true" : "false"}
                  {...register("name")}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-desc">Deskripsi singkat (opsional)</Label>
                <Textarea
                  id="create-desc"
                  placeholder="Catatan menu atau pengolahan hari ini"
                  {...register("description")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-funfact">Fakta seru edukasi gizi (opsional)</Label>
                <Input
                  id="create-funfact"
                  placeholder="Mis. Bayam kaya zat besi untuk menjaga semangat belajar!"
                  {...register("funFact")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-photo">Tautan foto menu (opsional)</Label>
                <Input
                  id="create-photo"
                  type="url"
                  placeholder="https://…"
                  aria-invalid={errors.photoUrl ? "true" : "false"}
                  {...register("photoUrl")}
                />
                {errors.photoUrl && (
                  <p className="text-sm text-destructive">{errors.photoUrl.message}</p>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setCreateForDate(null)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Membuat menu…" : "Simpan & Susun Bahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => handleStep(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Sebelumnya
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setAnchorDate(todayIso)}>
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Hari Ini
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => handleStep(1)}>
            Berikutnya
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="px-2 text-sm font-semibold text-foreground">
            {viewMode === "week"
              ? `${formatDateId(weekDates[0] ?? anchorDate)} – ${formatDateId(weekDates[6] ?? anchorDate)}`
              : formatMonthYearId(anchorYear, anchorMonth)}
          </span>
        </div>

        <div role="group" aria-label="Mode kalender" className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={viewMode === "week" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Mingguan
          </Button>
          <Button
            type="button"
            variant={viewMode === "month" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Bulanan
          </Button>
        </div>
      </div>

      {menusQuery.isPending && (
        <div
          role="status"
          className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Memuat jadwal menu…
        </div>
      )}

      {menusQuery.isError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
        >
          {menusQuery.error.message}
        </div>
      )}

      {menusQuery.isSuccess && viewMode === "week" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {weekDates.map((iso) => {
            const menu = menusByDate.get(iso);
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={`flex flex-col justify-between gap-3 rounded-lg border bg-card p-4 ${
                  isToday ? "border-primary" : "border-border"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{formatDateId(iso)}</p>
                    {menu && (
                      <Badge variant={menu.status === "published" ? "mint" : "accent"}>
                        {menu.status === "published" ? "Terbit" : "Draf"}
                      </Badge>
                    )}
                  </div>
                  {menu ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{menu.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {menu.portions.length} jenjang terisi
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada menu pada tanggal ini.</p>
                  )}
                </div>

                <div className="pt-1">
                  {menu ? (
                    <Link
                      to={`/admin/menus/${menu.id}`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
                    >
                      <Utensils className="h-4 w-4" aria-hidden="true" />
                      Buka &amp; Edit Menu
                    </Link>
                  ) : canCreate ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => openCreateForm(iso)}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Isi Menu
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {menusQuery.isSuccess && viewMode === "month" && (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <div className="grid grid-cols-7 border-b border-border bg-secondary/60 text-center text-xs font-semibold text-muted-foreground">
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                <div key={d} className="py-2.5">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-border">
              {monthCells.map((cell) => {
                const menu = menusByDate.get(cell.iso);
                return (
                  <div
                    key={cell.iso}
                    className={`flex min-h-28 flex-col justify-between gap-2 p-2.5 ${
                      cell.inMonth ? "" : "bg-background/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          cell.iso === todayIso ? "font-bold text-primary" : ""
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {menu && (
                        <Badge variant={menu.status === "published" ? "mint" : "accent"}>
                          {menu.status === "published" ? "Terbit" : "Draf"}
                        </Badge>
                      )}
                    </div>
                    {menu ? (
                      <Link
                        to={`/admin/menus/${menu.id}`}
                        className="line-clamp-2 rounded-sm px-1.5 py-1 text-xs font-semibold text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
                      >
                        {menu.name}
                      </Link>
                    ) : canCreate && cell.inMonth ? (
                      <button
                        type="button"
                        onClick={() => openCreateForm(cell.iso)}
                        className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-sm border border-dashed border-border px-2 text-xs text-muted-foreground hover:border-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                      >
                        + Buat
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            {monthCells
              .filter((cell) => cell.inMonth)
              .map((cell) => {
                const menu = menusByDate.get(cell.iso);
                return (
                  <div
                    key={cell.iso}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{formatDateId(cell.iso)}</p>
                      <p className="truncate font-semibold text-foreground">
                        {menu ? menu.name : "Belum ada menu"}
                      </p>
                    </div>
                    {menu ? (
                      <Link
                        to={`/admin/menus/${menu.id}`}
                        className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-border bg-secondary px-3 text-xs font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
                      >
                        Edit
                      </Link>
                    ) : canCreate ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openCreateForm(cell.iso)}
                      >
                        Buat
                      </Button>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
