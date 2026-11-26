import type { ApiErrorResponse } from "@mbg/shared";
import type { InferResponseType } from "hono/client";
import { api } from "@/lib/api";

export type PublicTodayResponse = InferResponseType<
  (typeof api.api.public.schools)[":slug"]["today"]["$get"],
  200
>;
export type PublicWeekResponse = InferResponseType<
  (typeof api.api.public.schools)[":slug"]["week"]["$get"],
  200
>;
export type PublicHouseholdFoodsResponse = InferResponseType<
  (typeof api.api.public.reference)["household-foods"]["$get"],
  200
>;
export type PublicAkgResponse = InferResponseType<
  typeof api.api.public.reference.akg.$get,
  200
>;

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

async function unwrapPublic<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    let message = fallback;
    try {
      const body = (await response.json()) as Partial<ApiErrorResponse>;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Ignore non-JSON error responses.
    }
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

/** Public read-only fetch for today's menu (no credentials/cookies needed). */
export async function fetchPublicToday(slug: string): Promise<PublicTodayResponse> {
  const res = await api.api.public.schools[":slug"].today.$get(
    { param: { slug } },
    { init: { cache: "no-cache" } },
  );
  return unwrapPublic<PublicTodayResponse>(res, "Gagal memuat menu hari ini.");
}

/** Public read-only fetch for weekly schedule (no credentials/cookies needed). */
export async function fetchPublicWeek(slug: string, start?: string): Promise<PublicWeekResponse> {
  const res = await api.api.public.schools[":slug"].week.$get(
    {
      param: { slug },
      query: start ? { start } : {},
    },
    { init: { cache: "no-cache" } },
  );
  return unwrapPublic<PublicWeekResponse>(res, "Gagal memuat jadwal mingguan.");
}

/** Public read-only fetch for URT household food catalog (cached for offline use). */
export async function fetchHouseholdFoods(): Promise<PublicHouseholdFoodsResponse> {
  const res = await api.api.public.reference["household-foods"].$get();
  return unwrapPublic<PublicHouseholdFoodsResponse>(res, "Gagal memuat daftar pangan URT.");
}

/** Public read-only fetch for AKG reference table (cached for offline use). */
export async function fetchAkgReference(): Promise<PublicAkgResponse> {
  const res = await api.api.public.reference.akg.$get();
  return unwrapPublic<PublicAkgResponse>(res, "Gagal memuat tabel referensi AKG.");
}
