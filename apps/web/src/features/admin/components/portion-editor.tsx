import {
  LEVELS,
  type Allergen,
  type Level,
  type PortionFoodLike,
  type PortionItemFormInput,
} from "@mbg/shared";
import { Copy, Save, Trash2 } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFoodCategoryLabel, LEVEL_LABELS, LEVEL_SHORT_LABELS } from "../lib/labels";
import { FoodCombobox, type FoodOption } from "./food-combobox";
import type { NutritionPanelItem } from "./nutrition-panel";

export interface EditablePortionItem {
  localKey: string;
  foodId: string;
  grams: number;
  label: string;
  visualUnit: string;
  benefit: string;
  foodName: string;
  foodCategory: string;
  food: PortionFoodLike;
}

export interface ServerPortionItem {
  id: string;
  foodId: string;
  grams: number;
  label: string | null;
  visualUnit: string | null;
  benefit: string | null;
  foodName: string;
  foodCategory: string;
  foodAllergens: Allergen[];
  foodEnergyKcal: number;
  foodProteinG: number;
  foodFatG: number;
  foodCarbG: number;
  foodFiberG: number;
  foodIronMg: number;
}

export interface ServerPortion {
  id: string;
  level: Level;
  items: ServerPortionItem[];
}

interface PortionEditorProps {
  portions: readonly ServerPortion[];
  activeLevel: Level;
  onActiveLevelChange: (level: Level) => void;
  onDraftChange: (level: Level, items: NutritionPanelItem[], isDirty: boolean) => void;
  onSave: (level: Level, items: PortionItemFormInput[]) => Promise<void>;
  isSaving: boolean;
}

function buildInitialDrafts(portions: readonly ServerPortion[]): Record<Level, EditablePortionItem[]> {
  const result: Record<Level, EditablePortionItem[]> = {
    sd_low: [],
    sd_high: [],
    smp: [],
    sma: [],
  };

  for (const portion of portions) {
    result[portion.level] = portion.items.map((item) => ({
      localKey: item.id,
      foodId: item.foodId,
      grams: item.grams,
      label: item.label ?? "",
      visualUnit: item.visualUnit ?? "",
      benefit: item.benefit ?? "",
      foodName: item.foodName,
      foodCategory: item.foodCategory,
      food: {
        energyKcal: item.foodEnergyKcal,
        proteinG: item.foodProteinG,
        fatG: item.foodFatG,
        carbG: item.foodCarbG,
        fiberG: item.foodFiberG,
        ironMg: item.foodIronMg,
        allergens: item.foodAllergens,
      },
    }));
  }

  return result;
}

/** Tabbed per-level portion editor with TKPI search, copy-from-level, and inline validation. */
export function PortionEditor({
  portions,
  activeLevel,
  onActiveLevelChange,
  onDraftChange,
  onSave,
  isSaving,
}: PortionEditorProps) {
  const [drafts, setDrafts] = useState<Record<Level, EditablePortionItem[]>>(() =>
    buildInitialDrafts(portions),
  );
  const [dirtyLevels, setDirtyLevels] = useState<Record<Level, boolean>>({
    sd_low: false,
    sd_high: false,
    smp: false,
    sma: false,
  });
  const [copySource, setCopySource] = useState<Level | "">("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const currentItems = drafts[activeLevel];
  const currentDirty = dirtyLevels[activeLevel];

  useEffect(() => {
    onDraftChange(
      activeLevel,
      currentItems.map((item) => ({
        foodId: item.foodId,
        grams: item.grams,
        food: item.food,
      })),
      currentDirty,
    );
  }, [activeLevel, currentDirty, currentItems, onDraftChange]);

  const updateActiveDraft = (updater: (prev: EditablePortionItem[]) => EditablePortionItem[]) => {
    setValidationError(null);
    setSaveMessage(null);
    setDrafts((prev) => ({ ...prev, [activeLevel]: updater(prev[activeLevel]) }));
    setDirtyLevels((prev) => ({ ...prev, [activeLevel]: true }));
  };

  const handleAddFood = (food: FoodOption) => {
    updateActiveDraft((prev) => [
      ...prev,
      {
        localKey: `${food.id}-${crypto.randomUUID()}`,
        foodId: food.id,
        grams: 100,
        label: food.name,
        visualUnit: "",
        benefit: "",
        foodName: food.name,
        foodCategory: food.category,
        food: {
          energyKcal: food.energyKcal,
          proteinG: food.proteinG,
          fatG: food.fatG,
          carbG: food.carbG,
          fiberG: food.fiberG,
          ironMg: food.ironMg,
          allergens: food.allergens,
        },
      },
    ]);
  };

  const handleCopyFromLevel = () => {
    if (!copySource || copySource === activeLevel) return;
    const sourceItems = drafts[copySource];
    if (sourceItems.length === 0) return;
    updateActiveDraft(() =>
      sourceItems.map((item) => ({
        ...item,
        localKey: `${item.foodId}-${crypto.randomUUID()}`,
      })),
    );
    setCopySource("");
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onActiveLevelChange(LEVELS[(idx + 1) % LEVELS.length]!);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onActiveLevelChange(LEVELS[(idx - 1 + LEVELS.length) % LEVELS.length]!);
    }
  };

  const handleSave = async () => {
    setValidationError(null);
    setSaveMessage(null);

    for (const item of currentItems) {
      if (!Number.isFinite(item.grams) || item.grams <= 0 || item.grams > 1000) {
        setValidationError(`Berat "${item.foodName}" harus lebih dari 0 dan maksimal 1000 g.`);
        return;
      }
    }

    const payload: PortionItemFormInput[] = currentItems.map((item) => ({
      foodId: item.foodId,
      grams: item.grams,
      label: item.label.trim() || null,
      visualUnit: item.visualUnit.trim() || null,
      benefit: item.benefit.trim() || null,
    }));

    try {
      await onSave(activeLevel, payload);
      setDirtyLevels((prev) => ({ ...prev, [activeLevel]: false }));
      setSaveMessage(`Porsi ${LEVEL_LABELS[activeLevel]} berhasil disimpan.`);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Gagal menyimpan porsi.");
    }
  };

  const copyCandidates = LEVELS.filter((lvl) => lvl !== activeLevel && drafts[lvl].length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Komposisi Bahan per Jenjang</CardTitle>
        <CardDescription>
          Pilih jenjang, cari bahan TKPI, lalu isi berat matang siap makan (g).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div
          role="tablist"
          aria-label="Jenjang pendidikan"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {LEVELS.map((level, idx) => {
            const selected = level === activeLevel;
            const count = drafts[level].length;
            return (
              <button
                key={level}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setValidationError(null);
                  setSaveMessage(null);
                  onActiveLevelChange(level);
                }}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-[background-color,border-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-secondary"
                }`}
              >
                <span className="truncate">{LEVEL_SHORT_LABELS[level]}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-xs tabular-nums ${
                    selected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <FoodCombobox onSelect={handleAddFood} disabled={isSaving} />
          </div>

          {copyCandidates.length > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="copy-level-select">Salin dari jenjang lain</Label>
                <select
                  id="copy-level-select"
                  value={copySource}
                  onChange={(event) => setCopySource(event.target.value as Level | "")}
                  className="min-h-11 rounded-[var(--radius-input)] border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
                >
                  <option value="">Pilih sumber…</option>
                  {copyCandidates.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {LEVEL_LABELS[lvl]} ({drafts[lvl].length} bahan)
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyFromLevel}
                disabled={!copySource || isSaving}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Salin
              </Button>
            </div>
          )}
        </div>

        {validationError && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {validationError}
          </p>
        )}
        {saveMessage && (
          <p
            role="status"
            className="rounded-md border border-[var(--color-success)]/40 bg-mint/30 px-3.5 py-2.5 text-sm text-foreground"
          >
            {saveMessage}
          </p>
        )}

        {currentItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada bahan untuk jenjang {LEVEL_LABELS[activeLevel]}. Cari bahan TKPI di atas atau
            salin dari jenjang lain.
          </div>
        ) : (
          <div className="space-y-3">
            {currentItems.map((item, idx) => (
              <div
                key={item.localKey}
                className="space-y-3 rounded-md border border-border bg-background/60 p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{item.foodName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="default">{getFoodCategoryLabel(item.foodCategory)}</Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(item.food.energyKcal)} kkal / 100g
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveDraft((prev) => prev.filter((row) => row.localKey !== item.localKey))
                    }
                    aria-label={`Hapus ${item.foodName}`}
                    className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-destructive/50 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor={`grams-${idx}`}>Berat matang siap makan (g)</Label>
                    <Input
                      id={`grams-${idx}`}
                      type="number"
                      min={1}
                      max={1000}
                      step="0.5"
                      value={Number.isNaN(item.grams) ? "" : item.grams}
                      onChange={(event) => {
                        const val = Number(event.target.value);
                        updateActiveDraft((prev) =>
                          prev.map((row) =>
                            row.localKey === item.localKey ? { ...row, grams: val } : row,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`visual-${idx}`}>Satuan visual (URT)</Label>
                    <Input
                      id={`visual-${idx}`}
                      placeholder="Mis. 1 centong / 1 potong sedang"
                      value={item.visualUnit}
                      onChange={(event) => {
                        const val = event.target.value;
                        updateActiveDraft((prev) =>
                          prev.map((row) =>
                            row.localKey === item.localKey ? { ...row, visualUnit: val } : row,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label-${idx}`}>Label tampil untuk siswa</Label>
                    <Input
                      id={`label-${idx}`}
                      placeholder="Mis. Nasi putih"
                      value={item.label}
                      onChange={(event) => {
                        const val = event.target.value;
                        updateActiveDraft((prev) =>
                          prev.map((row) =>
                            row.localKey === item.localKey ? { ...row, label: val } : row,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`benefit-${idx}`}>Manfaat fungsi tubuh</Label>
                    <Input
                      id={`benefit-${idx}`}
                      placeholder="Mis. Memberi tenaga untuk belajar"
                      value={item.benefit}
                      onChange={(event) => {
                        const val = event.target.value;
                        updateActiveDraft((prev) =>
                          prev.map((row) =>
                            row.localKey === item.localKey ? { ...row, benefit: val } : row,
                          ),
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Simpan setiap jenjang sebelum berpindah halaman agar perubahan tidak hilang.
          </p>
          <Button type="button" variant="primary" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Menyimpan…" : `Simpan Porsi ${LEVEL_SHORT_LABELS[activeLevel]}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
