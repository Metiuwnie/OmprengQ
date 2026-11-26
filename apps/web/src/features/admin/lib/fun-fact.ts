import type { NutrientTotals } from "@mbg/shared";

export interface FunFactFoodLike extends NutrientTotals {
  name: string;
  category: string;
}

/**
 * Derive a concise, child-friendly Indonesian nutrition fun fact directly from
 * the selected TKPI foods and their nutrient profiles (no manual input needed).
 */
export function generateNutritionFunFact(foods: readonly FunFactFoodLike[]): string {
  if (foods.length === 0) return "";

  // Deduplicate by lowercase name while preserving order
  const uniqueFoods: FunFactFoodLike[] = [];
  const seen = new Set<string>();
  for (const food of foods) {
    const key = food.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueFoods.push(food);
  }

  if (uniqueFoods.length === 0) return "";

  const topIron = [...uniqueFoods].sort((a, b) => b.ironMg - a.ironMg)[0];
  const topProtein = [...uniqueFoods].sort((a, b) => b.proteinG - a.proteinG)[0];
  const topFiber = [...uniqueFoods].sort((a, b) => b.fiberG - a.fiberG)[0];
  const topEnergy = [...uniqueFoods].sort((a, b) => b.energyKcal - a.energyKcal)[0];

  const highlights: string[] = [];

  if (topIron && topIron.ironMg >= 2) {
    highlights.push(`${topIron.name} kaya zat besi untuk menjaga fokus dan semangat belajar`);
  }
  if (topProtein && topProtein.proteinG >= 10 && topProtein.name !== topIron?.name) {
    highlights.push(`${topProtein.name} tinggi protein untuk membantu pertumbuhan dan daya tahan tubuh`);
  }
  if (
    topFiber &&
    topFiber.fiberG >= 2 &&
    topFiber.name !== topIron?.name &&
    topFiber.name !== topProtein?.name
  ) {
    highlights.push(`${topFiber.name} kaya serat untuk menjaga pencernaan tetap sehat`);
  }

  if (highlights.length === 0 && topProtein && topProtein.proteinG >= 5) {
    highlights.push(`${topProtein.name} mengandung protein untuk membantu tubuh tumbuh kuat`);
  }
  if (highlights.length === 0 && topEnergy) {
    highlights.push(`${topEnergy.name} memberi energi agar tetap aktif dan bersemangat di sekolah`);
  }

  const chosen = highlights.slice(0, 2);
  if (chosen.length === 1) {
    return `${chosen[0]}!`;
  }
  return `${chosen[0]}, sedangkan ${chosen[1]}!`;
}

/** Build a concise menu name strictly from the selected TKPI food names. */
export function buildMenuNameFromFoods(foods: readonly Pick<FunFactFoodLike, "name">[]): string {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const food of foods) {
    const trimmed = food.name.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    names.push(trimmed);
  }
  return names.join(", ").slice(0, 300);
}
