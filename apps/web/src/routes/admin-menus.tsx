import { zodResolver } from "@hookform/resolvers/zod";
import {
  ALLERGEN_LABELS,
  createMenuSchema,
  FOOD_CATEGORIES,
  sumNutrientTotals,
  type Allergen,
  type AuthUser,
  type CreateMenuInput,
  type FoodCategory,
} from "@mbg/shared";
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
import { saveMenuPortion } from "../features/admin/api/admin-api";
import { FoodCombobox, type FoodOption } from "../features/admin/components/food-combobox";
import { useCreateMenuMutation, useMenusQuery, useSppgList } from "../features/admin/hooks/use-menus";
import { buildMenuNameFromFoods, generateNutritionFunFact } from "../features/admin/lib/fun-fact";
import {
  formatDateId,
  formatMonthYearId,
  getFoodCategoryLabel,
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
  const [selectedFoods, setSelectedFoods] = useState<FoodOption[]>([]);
  const [foodSelectionError, setFoodSelectionError] = useState<string | null>(null);

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

  const orderedSelectedFoods = useMemo(() => {
    const orderMap = new Map<string, number>(FOOD_CATEGORIES.map((cat, idx) => [cat, idx]));
    return [...selectedFoods].sort(
      (a, b) => (orderMap.get(a.category) ?? 99) - (orderMap.get(b.category) ?? 99),
    );
  }, [selectedFoods]);

  const selectedFoodsByCategory = useMemo(() => {
    const map = new Map<FoodCategory, FoodOption[]>();
    for (const cat of FOOD_CATEGORIES) {
      map.set(cat, []);
    }
    for (const food of selectedFoods) {
      const list = map.get(food.category as FoodCategory);
      if (list) list.push(food);
    }
    return map;
  }, [selectedFoods]);

  const derivedMenuName = useMemo(
    () => buildMenuNameFromFoods(orderedSelectedFoods),
    [orderedSelectedFoods],
  );
  const derivedFunFact = useMemo(
    () => generateNutritionFunFact(orderedSelectedFoods),
    [orderedSelectedFoods],
  );
  const totalNutrition = useMemo(
    () =>
      sumNutrientTotals(
        orderedSelectedFoods.map((food) => ({
          energyKcal: food.energyKcal,
          proteinG: food.proteinG,
          fatG: food.fatG,
          carbG: food.carbG,
          fiberG: food.fiberG,
          ironMg: food.ironMg,
        })),
      ),
    [orderedSelectedFoods],
  );
  const totalAllergens = useMemo(() => {
    const found = new Set<Allergen>();
    for (const food of orderedSelectedFoods) {
      for (const allergen of food.allergens) {
        found.add(allergen);
      }
    }
    return Array.from(found);
  }, [orderedSelectedFoods]);

  const handleAddTkpiFood = (food: FoodOption) => {
    setFoodSelectionError(null);
    setSelectedFoods((prev) => {
      if (prev.some((item) => item.id === food.id)) return prev;
      const next = [...prev, food];
      setValue("name", buildMenuNameFromFoods(next), { shouldValidate: true });
      setValue("funFact", generateNutritionFunFact(next));
      return next;
    });
  };

  const handleRemoveTkpiFood = (foodId: string) => {
    setSelectedFoods((prev) => {
      const next = prev.filter((item) => item.id !== foodId);
      setValue("name", buildMenuNameFromFoods(next), { shouldValidate: true });
      setValue("funFact", generateNutritionFunFact(next));
      return next;
    });
  };

  const openCreateForm = (date: string) => {
    setSelectedFoods([]);
    setFoodSelectionError(null);
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
    if (selectedFoods.length === 0) {
      setFoodSelectionError("Pilih minimal satu bahan dari daftar TKPI.");
      return;
    }
    const created = await createMutation.mutateAsync({
      date: values.date,
      name: derivedMenuName,
      description: values.description,
      funFact: derivedFunFact || null,
      photoUrl: null,
      sppgId: isSuperAdmin ? activeSppgId : undefined,
    });
    // Pre-populate initial portion so admin doesn't have to re-pick the same TKPI foods.
    await saveMenuPortion(
      created.menu.id,
      "sd_low",
      orderedSelectedFoods.map((food) => ({
        foodId: food.id,
        grams: 100,
      })),
    );
    navigate(`/admin/menus/${created.menu.id}`);
  };

  const canCreate = user.role === "super_admin" || user.role === "sppg_admin";
  const todayIso = toIsoDate();

  return (
    <div className="w-full space-y-6">
      <div className="clay-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Menu Harian MBG</h1>
          {canCreate && (
            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={isSuperAdmin && !activeSppgId}
              onClick={() => openCreateForm(anchorDate)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Buat Menu
            </Button>
          )}
        </div>

        {isSuperAdmin && (
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border/70 pt-4">
            <div className="w-full max-w-sm space-y-1.5">
              <Label htmlFor="sppg-filter">SPPG yang dikelola</Label>
              <select
                id="sppg-filter"
                value={activeSppgId}
                onChange={(event) => {
                  setSelectedSppgId(event.target.value);
                  setCreateForDate(null);
                }}
                className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
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
      </div>

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
                <FoodCombobox onSelect={handleAddTkpiFood} disabled={createMutation.isPending} />
                {(foodSelectionError || errors.name) && (
                  <p className="text-sm text-destructive">
                    {foodSelectionError ?? errors.name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-3 sm:col-span-2">
                {selectedFoods.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border bg-background/60 px-3.5 py-2.5 text-sm text-muted-foreground">
                    Pilih bahan dari daftar TKPI di atas. Bahan yang dipilih akan dikelompokkan otomatis sesuai kategorinya.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {FOOD_CATEGORIES.filter(
                        (category) => (selectedFoodsByCategory.get(category)?.length ?? 0) > 0,
                      ).map((category) => {
                        const items = selectedFoodsByCategory.get(category) ?? [];
                        return (
                          <div
                            key={category}
                            className="space-y-2 rounded-xl border border-border/80 bg-background/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {getFoodCategoryLabel(category)}
                              </span>
                              <Badge variant="mint">{items.length}</Badge>
                            </div>
                            <ul className="space-y-1.5">
                              {items.map((food) => (
                                <li
                                  key={food.id}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-foreground">
                                      {food.name}
                                    </p>
                                    <p className="truncate tabular-nums text-muted-foreground">
                                      {Math.round(food.energyKcal)} kkal, P{" "}
                                      {food.proteinG.toFixed(1)}g, Serat {food.fiberG.toFixed(1)}g,
                                      Besi {food.ironMg.toFixed(1)}mg
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTkpiFood(food.id)}
                                    aria-label={`Hapus ${food.name}`}
                                    className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                                  >
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-border/80 bg-mint-soft/40 p-3.5">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Ringkasan Total Gizi Menu (estimasi per 100g tiap bahan)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedFoods.length} bahan terpilih
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Energi</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {Math.round(totalNutrition.energyKcal)} kkal
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Protein</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {totalNutrition.proteinG.toFixed(1)} g
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Lemak</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {totalNutrition.fatG.toFixed(1)} g
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Karbohidrat</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {totalNutrition.carbG.toFixed(1)} g
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Serat</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {totalNutrition.fiberG.toFixed(1)} g
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">Zat Besi</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {totalNutrition.ironMg.toFixed(1)} mg
                          </p>
                        </div>
                      </div>
                      {totalAllergens.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Alergen terdeteksi: </span>
                          {totalAllergens.map((a) => ALLERGEN_LABELS[a]).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-desc">Deskripsi singkat (opsional)</Label>
                <Textarea
                  id="create-desc"
                  placeholder="Catatan menu atau pengolahan hari ini"
                  {...register("description")}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setCreateForDate(null)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createMutation.isPending || selectedFoods.length === 0}
                >
                  {createMutation.isPending ? "Membuat menu…" : "Simpan & Susun Bahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="clay-card flex flex-col gap-3 p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full px-2 sm:w-auto sm:px-3"
              onClick={() => handleStep(-1)}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">Lalu</span>
              <span className="hidden sm:inline">Sebelumnya</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full px-2 sm:w-auto sm:px-3"
              onClick={() => setAnchorDate(todayIso)}
            >
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              Hari Ini
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full px-2 sm:w-auto sm:px-3"
              onClick={() => handleStep(1)}
            >
              <span className="sm:hidden">Depan</span>
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
          <span className="text-center text-sm font-semibold text-foreground sm:px-2 sm:text-left">
            {viewMode === "week"
              ? `${formatDateId(weekDates[0] ?? anchorDate)} – ${formatDateId(weekDates[6] ?? anchorDate)}`
              : formatMonthYearId(anchorYear, anchorMonth)}
          </span>
        </div>

        <div
          role="group"
          aria-label="Mode kalender"
          className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center"
        >
          <Button
            type="button"
            variant={viewMode === "week" ? "primary" : "secondary"}
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setViewMode("week")}
          >
            Mingguan
          </Button>
          <Button
            type="button"
            variant={viewMode === "month" ? "primary" : "secondary"}
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setViewMode("month")}
          >
            Bulanan
          </Button>
        </div>
      </div>

      {menusQuery.isPending && (
        <div
          role="status"
          className="clay-card px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Memuat jadwal menu…
        </div>
      )}

      {menusQuery.isError && (
        <div
          role="alert"
          className="clay-card border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
        >
          {menusQuery.error.message}
        </div>
      )}

      {menusQuery.isSuccess && viewMode === "week" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {weekDates.map((iso) => {
            const menu = menusByDate.get(iso);
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={`clay-card flex flex-col justify-between gap-3 p-4 ${
                  isToday ? "bg-gradient-to-b from-card to-mint-soft/40 ring-2 ring-primary/40" : ""
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
          <div className="clay-card hidden overflow-hidden md:block">
            <div className="grid grid-cols-7 border-b border-border bg-sky-soft/70 text-center text-xs font-semibold text-foreground/80">
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
                    className="clay-card flex items-center justify-between gap-3 p-3.5"
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
