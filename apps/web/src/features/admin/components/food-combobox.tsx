import type { Allergen, FoodCategory } from "@mbg/shared";
import { Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFoodSearchQuery } from "../hooks/use-menus";
import { ALLERGEN_LABELS, getFoodCategoryLabel } from "../lib/labels";

export interface FoodOption {
  id: string;
  code: string | null;
  name: string;
  category: string;
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  fiberG: number;
  ironMg: number;
  ediblePct: number;
  allergens: Allergen[];
  isCustom: boolean;
}

interface FoodComboboxProps {
  onSelect: (food: FoodOption) => void;
  disabled?: boolean;
  category?: FoodCategory;
  label?: string;
  placeholder?: string;
}

/** Keyboard-accessible TKPI food search combobox with debounced server lookup. */
export function FoodCombobox({
  onSelect,
  disabled = false,
  category,
  label = "Tambah bahan dari TKPI",
  placeholder = "Cari nasi, ayam, telur, tempe, kangkung…",
}: FoodComboboxProps) {
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const foodsQuery = useFoodSearchQuery(debouncedQuery, category, 20);
  const options: FoodOption[] = foodsQuery.data?.foods ?? [];

  const selectOption = (food: FoodOption) => {
    onSelect(food);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || options.length === 0) {
      if (event.key === "Escape") setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = options[activeIndex];
      if (chosen) selectOption(chosen);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[activeIndex] ? `${listboxId}-${activeIndex}` : undefined}
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Daftar bahan TKPI"
          className="absolute z-[350] mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-[var(--shadow-card)]"
        >
          {foodsQuery.isPending && (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">Mencari bahan…</li>
          )}
          {foodsQuery.isError && (
            <li className="px-3 py-2.5 text-sm text-destructive">{foodsQuery.error.message}</li>
          )}
          {!foodsQuery.isPending && !foodsQuery.isError && options.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              Bahan tidak ditemukan. Gunakan kata kunci lain atau tambah bahan custom di halaman Bahan.
            </li>
          )}
          {options.map((food, idx) => {
            const isActive = idx === activeIndex;
            return (
              <li key={food.id} id={`${listboxId}-${idx}`} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectOption(food)}
                  className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm transition-[background-color,color] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                    isActive ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{food.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getFoodCategoryLabel(food.category)}
                      {food.allergens.length > 0
                        ? ` · Alergen: ${food.allergens.map((a) => ALLERGEN_LABELS[a]).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                    {Math.round(food.energyKcal)} kkal/100g
                    <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
