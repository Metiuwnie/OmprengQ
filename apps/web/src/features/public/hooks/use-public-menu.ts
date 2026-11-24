import { useQuery } from "@tanstack/react-query";
import { fetchPublicToday, fetchPublicWeek, NotFoundError } from "../api/public-api";

export function usePublicTodayQuery(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "today", slug],
    queryFn: () => fetchPublicToday(slug!),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
    retry: (count, error) => !(error instanceof NotFoundError) && count < 1,
  });
}

export function usePublicWeekQuery(slug: string | undefined, start?: string) {
  return useQuery({
    queryKey: ["public", "week", slug, start ?? "current"],
    queryFn: () => fetchPublicWeek(slug!, start),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
    retry: (count, error) => !(error instanceof NotFoundError) && count < 1,
  });
}
