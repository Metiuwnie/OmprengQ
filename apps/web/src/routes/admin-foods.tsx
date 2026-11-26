import {
  ALLERGENS,
  FOOD_CATEGORIES,
  type Allergen,
  type FoodCategory,
} from "@mbg/shared";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodSearchResponse } from "../features/admin/api/admin-api";
import {
  useCreateFoodMutation,
  useDeleteFoodMutation,
  useUpdateFoodMutation,
} from "../features/admin/hooks/use-admin-resources";
import { useFoodSearchQuery } from "../features/admin/hooks/use-menus";
import { ALLERGEN_LABELS, FOOD_CATEGORY_LABELS, getFoodCategoryLabel } from "../features/admin/lib/labels";

type FoodRow = FoodSearchResponse["foods"][number];

/** TKPI foods reference & custom food management page at `/admin/foods`. */
export function AdminFoodsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | "">("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const foodsQuery = useFoodSearchQuery(
    debouncedQ,
    categoryFilter ? categoryFilter : undefined,
    100,
  );
  const createMutation = useCreateFoodMutation();
  const updateMutation = useUpdateFoodMutation();
  const deleteMutation = useDeleteFoodMutation();

  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<FoodCategory>("lauk_hewani");
  const [energyKcal, setEnergyKcal] = useState("0");
  const [proteinG, setProteinG] = useState("0");
  const [fatG, setFatG] = useState("0");
  const [carbG, setCarbG] = useState("0");
  const [fiberG, setFiberG] = useState("0");
  const [ironMg, setIronMg] = useState("0");
  const [ediblePct, setEdiblePct] = useState("100");
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setName("");
    setCode("");
    setCategory("lauk_hewani");
    setEnergyKcal("0");
    setProteinG("0");
    setFatG("0");
    setCarbG("0");
    setFiberG("0");
    setIronMg("0");
    setEdiblePct("100");
    setAllergens([]);
    setFormError(null);
  };

  const openEdit = (food: FoodRow) => {
    setFormMode("edit");
    setEditingId(food.id);
    setName(food.name);
    setCode(food.code ?? "");
    setCategory((food.category as FoodCategory) || "lainnya");
    setEnergyKcal(String(food.energyKcal));
    setProteinG(String(food.proteinG));
    setFatG(String(food.fatG));
    setCarbG(String(food.carbG));
    setFiberG(String(food.fiberG));
    setIronMg(String(food.ironMg));
    setEdiblePct(String(food.ediblePct));
    setAllergens(food.allergens);
    setFormError(null);
  };

  const toggleAllergen = (item: Allergen) => {
    setAllergens((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Nama bahan wajib diisi.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim() || null,
      category,
      energyKcal: Number(energyKcal) || 0,
      proteinG: Number(proteinG) || 0,
      fatG: Number(fatG) || 0,
      carbG: Number(carbG) || 0,
      fiberG: Number(fiberG) || 0,
      ironMg: Number(ironMg) || 0,
      ediblePct: Math.min(100, Math.max(0, Number(ediblePct) || 100)),
      allergens,
    };

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (formMode === "edit" && editingId) {
        await updateMutation.mutateAsync({ id: editingId, input: payload });
      }
      setFormMode("closed");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan bahan custom.");
    }
  };

  const foodRows = foodsQuery.data?.foods ?? [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full space-y-6">
      <div className="clay-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bahan Pangan TKPI</h1>
          <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah Bahan Custom
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-border/70 pt-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="foods-search">Cari nama atau kode bahan</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="foods-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ketik nama bahan atau kode TKPI…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-full space-y-1.5 sm:w-56">
            <Label htmlFor="foods-cat-filter">Filter kategori</Label>
            <select
              id="foods-cat-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as FoodCategory | "")}
              className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
            >
              <option value="">Semua kategori</option>
              {FOOD_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {FOOD_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {formMode !== "closed" && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  {formMode === "create" ? "Tambah Bahan Custom" : "Ubah Bahan Custom"}
                </CardTitle>
                <CardDescription>
                  Masukkan kandungan gizi per 100 gram bagian dapat dimakan (BDD).
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setFormMode("closed")}
                aria-label="Tutup form bahan"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {formError && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="food-name">Nama bahan</Label>
                <Input
                  id="food-name"
                  placeholder="Mis. Ayam suwir bumbu kuning"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-code">Kode (opsional)</Label>
                <Input
                  id="food-code"
                  placeholder="CUSTOM-01"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-cat">Kategori</Label>
                <select
                  id="food-cat"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as FoodCategory)}
                  className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-card px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
                >
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {FOOD_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-energy">Energi (kkal)</Label>
                <Input id="food-energy" type="number" min={0} step="0.1" value={energyKcal} onChange={(e) => setEnergyKcal(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-protein">Protein (g)</Label>
                <Input id="food-protein" type="number" min={0} step="0.1" value={proteinG} onChange={(e) => setProteinG(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-fat">Lemak (g)</Label>
                <Input id="food-fat" type="number" min={0} step="0.1" value={fatG} onChange={(e) => setFatG(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-carb">Karbohidrat (g)</Label>
                <Input id="food-carb" type="number" min={0} step="0.1" value={carbG} onChange={(e) => setCarbG(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-fiber">Serat (g)</Label>
                <Input id="food-fiber" type="number" min={0} step="0.1" value={fiberG} onChange={(e) => setFiberG(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-iron">Zat besi (mg)</Label>
                <Input id="food-iron" type="number" min={0} step="0.1" value={ironMg} onChange={(e) => setIronMg(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-bdd">BDD (%)</Label>
                <Input id="food-bdd" type="number" min={0} max={100} step="1" value={ediblePct} onChange={(e) => setEdiblePct(e.target.value)} />
              </div>

              <fieldset className="space-y-2 sm:col-span-3">
                <legend className="text-sm font-medium text-foreground">Tag alergen (opsional)</legend>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((item) => (
                    <label
                      key={item}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={allergens.includes(item)}
                        onChange={() => toggleAllergen(item)}
                        className="h-4 w-4 accent-primary"
                      />
                      {ALLERGEN_LABELS[item]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap justify-end gap-2 sm:col-span-3">
                <Button type="button" variant="secondary" onClick={() => setFormMode("closed")}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan…" : "Simpan Bahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {foodsQuery.isPending && (
        <div
          role="status"
          className="clay-card px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Memuat bahan pangan…
        </div>
      )}

      {foodsQuery.isError && (
        <div
          role="alert"
          className="clay-card border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
        >
          {foodsQuery.error.message}
        </div>
      )}

      {foodsQuery.isSuccess && foodRows.length === 0 && (
        <div className="clay-card border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Tidak ada bahan yang cocok dengan pencarian Anda.
        </div>
      )}

      {foodsQuery.isSuccess && foodRows.length > 0 && (
        <>
          <div className="clay-card hidden overflow-x-auto overflow-hidden md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-sky-soft/70 text-xs font-semibold text-foreground/80">
                <tr>
                  <th className="px-4 py-3">Bahan (per 100 g)</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Energi</th>
                  <th className="px-4 py-3 text-right">Protein</th>
                  <th className="px-4 py-3 text-right">Karbo</th>
                  <th className="px-4 py-3 text-right">Serat</th>
                  <th className="px-4 py-3 text-right">Besi</th>
                  <th className="px-4 py-3">Alergen</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {foodRows.map((food) => (
                  <tr key={food.id} className="transition-colors hover:bg-sky-soft/25">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{food.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={food.isCustom ? "accent" : "default"}>
                          {food.isCustom ? "Custom" : "TKPI"}
                        </Badge>
                        {food.code && (
                          <span className="font-mono text-xs text-muted-foreground">{food.code}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getFoodCategoryLabel(food.category)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{food.energyKcal}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{food.proteinG}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{food.carbG}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{food.fiberG}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{food.ironMg}</td>
                    <td className="px-4 py-3">
                      {food.allergens.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {food.allergens.map((a) => (
                            <Badge key={a} variant="accent">
                              {ALLERGEN_LABELS[a]}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {food.isCustom ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(food)}
                            aria-label={`Ubah ${food.name}`}
                            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground shadow-2xs hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(food.id)}
                            disabled={deleteMutation.isPending}
                            aria-label={`Hapus ${food.name}`}
                            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-destructive shadow-2xs hover:bg-coral-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Bawaan</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2.5 md:hidden">
            {foodRows.map((food) => (
              <div key={food.id} className="clay-card space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getFoodCategoryLabel(food.category)}
                    </p>
                  </div>
                  <Badge variant={food.isCustom ? "accent" : "default"}>
                    {food.isCustom ? "Custom" : "TKPI"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Energi {food.energyKcal} kkal, Protein {food.proteinG} g, Serat {food.fiberG} g,
                  Besi {food.ironMg} mg
                </p>
                {food.isCustom && (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(food)}>
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(food.id)}
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
