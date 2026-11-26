import type {
  Allergen,
  ChildProfile,
  EatenFraction,
  HouseholdFoodCatalogItem,
  Level,
  NutrientTotals,
} from "@mbg/shared";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchAkgReference, fetchHouseholdFoods, NotFoundError } from "@/features/public/api/public-api";
import { usePublicTodayQuery } from "@/features/public/hooks/use-public-menu";
import { computeCalculatorSummary, type CalculatorSummary } from "../lib/calculator-logic";

const REFERENCE_STALE_TIME = 1000 * 60 * 60;
const REFERENCE_GC_TIME = 1000 * 60 * 60 * 24;

/** Fetch today's menu (or fallback next published menu) and resolve requested school level portion. */
export function useTodayMenu(slug: string | undefined, level: Level) {
  const query = usePublicTodayQuery(slug);

  const resolved = useMemo(() => {
    const data = query.data;
    if (!data) {
      return {
        school: null,
        date: null,
        activeMenu: null,
        isUsingNextFallback: false,
        portion: null,
        availableLevels: [] as Level[],
      };
    }

    const activeMenu = data.menu ?? data.next ?? null;
    const isUsingNextFallback = Boolean(!data.menu && data.next);
    const portion = activeMenu?.portions[level] ?? null;
    const availableLevels = activeMenu
      ? (Object.keys(activeMenu.portions) as Level[])
      : ([] as Level[]);

    return {
      school: data.school,
      date: data.date,
      activeMenu,
      isUsingNextFallback,
      portion,
      availableLevels,
    };
  }, [query.data, level]);

  return {
    ...query,
    ...resolved,
  };
}

/** Cached public URT household food catalog for offline-ready recommendations. */
export function useHouseholdFoodsQuery() {
  return useQuery({
    queryKey: ["public", "reference", "household-foods"],
    queryFn: fetchHouseholdFoods,
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
    retry: (count, error) => !(error instanceof NotFoundError) && count < 1,
  });
}

/** Cached public AKG reference table. */
export function useAkgReferenceQuery() {
  return useQuery({
    queryKey: ["public", "reference", "akg"],
    queryFn: fetchAkgReference,
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
    retry: (count, error) => !(error instanceof NotFoundError) && count < 1,
  });
}

export interface UseGapResultArgs {
  profile: ChildProfile | null;
  portionTotals: NutrientTotals | null | undefined;
  portionAllergens: readonly Allergen[] | null | undefined;
  mbgFoodNames: readonly string[];
  eaten: EatenFraction;
  skipAllergenPart: boolean;
  catalog: readonly HouseholdFoodCatalogItem[];
}

/** Memoized nutritional gap & recommendation computation delegating exclusively to `@mbg/shared`. */
export function useGapResult({
  profile,
  portionTotals,
  portionAllergens,
  mbgFoodNames,
  eaten,
  skipAllergenPart,
  catalog,
}: UseGapResultArgs): CalculatorSummary | null {
  return useMemo(() => {
    if (!profile) return null;
    return computeCalculatorSummary({
      profile,
      portionTotals,
      portionAllergens,
      mbgFoodNames,
      eaten,
      skipAllergenPart,
      catalog,
    });
  }, [profile, portionTotals, portionAllergens, mbgFoodNames, eaten, skipAllergenPart, catalog]);
}
