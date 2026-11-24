import type {
  ApiErrorResponse,
  CopyMenuInput,
  CreateFoodInput,
  CreateMenuInput,
  CreateSchoolInput,
  CreateSppgInput,
  FoodCategory,
  Level,
  PortionItemFormInput,
  UpdateFoodInput,
  UpdateMenuInput,
  UpdateSchoolInput,
  UpdateSppgInput,
} from "@mbg/shared";
import type { InferResponseType } from "hono/client";
import { api } from "@/lib/api";

export type SppgListResponse = InferResponseType<typeof api.api.admin.sppg.$get, 200>;
export type CreateSppgResponse = InferResponseType<typeof api.api.admin.sppg.$post, 201>;
export type UpdateSppgResponse = InferResponseType<(typeof api.api.admin.sppg)[":id"]["$put"], 200>;
export type SchoolListResponse = InferResponseType<typeof api.api.admin.schools.$get, 200>;
export type CreateSchoolResponse = InferResponseType<typeof api.api.admin.schools.$post, 201>;
export type UpdateSchoolResponse = InferResponseType<
  (typeof api.api.admin.schools)[":id"]["$put"],
  200
>;
export type CreateFoodResponse = InferResponseType<typeof api.api.admin.foods.$post, 201>;
export type UpdateFoodResponse = InferResponseType<(typeof api.api.admin.foods)[":id"]["$put"], 200>;
export type MenuListResponse = InferResponseType<typeof api.api.admin.menus.$get, 200>;
export type MenuDetailResponse = InferResponseType<(typeof api.api.admin.menus)[":id"]["$get"], 200>;
export type CreateMenuResponse = InferResponseType<typeof api.api.admin.menus.$post, 201>;
export type UpdateMenuResponse = InferResponseType<(typeof api.api.admin.menus)[":id"]["$put"], 200>;
export type SavePortionResponse = InferResponseType<
  (typeof api.api.admin.menus)[":id"]["portions"][":level"]["$put"],
  200
>;
export type PublishMenuResponse = InferResponseType<
  (typeof api.api.admin.menus)[":id"]["publish"]["$post"],
  200
>;
export type CopyMenuResponse = InferResponseType<typeof api.api.admin.menus.copy.$post, 201>;
export type FoodSearchResponse = InferResponseType<typeof api.api.admin.foods.$get, 200>;

async function unwrap<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    let message = fallback;
    try {
      const body = (await response.json()) as Partial<ApiErrorResponse>;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Ignore non-JSON error body.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchSppgList(): Promise<SppgListResponse> {
  const res = await api.api.admin.sppg.$get();
  return unwrap<SppgListResponse>(res, "Gagal memuat daftar SPPG.");
}

export async function fetchMenus(params: {
  from?: string;
  to?: string;
  sppgId?: string;
}): Promise<MenuListResponse> {
  const res = await api.api.admin.menus.$get({
    query: {
      from: params.from,
      to: params.to,
      sppgId: params.sppgId,
    },
  });
  return unwrap<MenuListResponse>(res, "Gagal memuat daftar menu.");
}

export async function fetchMenuDetail(id: string): Promise<MenuDetailResponse> {
  const res = await api.api.admin.menus[":id"].$get({ param: { id } });
  return unwrap<MenuDetailResponse>(res, "Gagal memuat rincian menu.");
}

export async function createMenu(input: CreateMenuInput): Promise<CreateMenuResponse> {
  const res = await api.api.admin.menus.$post({ json: input });
  return unwrap<CreateMenuResponse>(res, "Gagal membuat menu baru.");
}

export async function updateMenu(id: string, input: UpdateMenuInput): Promise<UpdateMenuResponse> {
  const res = await api.api.admin.menus[":id"].$put({ param: { id }, json: input });
  return unwrap<UpdateMenuResponse>(res, "Gagal menyimpan perubahan menu.");
}

export async function deleteMenu(id: string, confirm = false): Promise<{ ok: true }> {
  const res = await api.api.admin.menus[":id"].$delete({
    param: { id },
    query: confirm ? { confirm: "true" } : {},
  });
  return unwrap<{ ok: true }>(res, "Gagal menghapus menu.");
}

export async function saveMenuPortion(
  menuId: string,
  level: Level,
  items: PortionItemFormInput[],
): Promise<SavePortionResponse> {
  const res = await api.api.admin.menus[":id"].portions[":level"].$put({
    param: { id: menuId, level },
    json: { items },
  });
  return unwrap<SavePortionResponse>(res, "Gagal menyimpan porsi jenjang.");
}

export async function publishMenu(id: string): Promise<PublishMenuResponse> {
  const res = await api.api.admin.menus[":id"].publish.$post({ param: { id } });
  return unwrap<PublishMenuResponse>(res, "Gagal mempublikasikan menu.");
}

export async function copyMenu(input: CopyMenuInput): Promise<CopyMenuResponse> {
  const res = await api.api.admin.menus.copy.$post({ json: input });
  return unwrap<CopyMenuResponse>(res, "Gagal menyalin menu.");
}

export async function searchFoods(params: {
  q?: string;
  category?: FoodCategory;
  limit?: number;
}): Promise<FoodSearchResponse> {
  const res = await api.api.admin.foods.$get({
    query: {
      q: params.q || undefined,
      category: params.category,
      limit: params.limit,
    },
  });
  return unwrap<FoodSearchResponse>(res, "Gagal mencari bahan makanan.");
}

export async function createFood(input: CreateFoodInput): Promise<CreateFoodResponse> {
  const res = await api.api.admin.foods.$post({ json: input });
  return unwrap<CreateFoodResponse>(res, "Gagal menambah bahan custom.");
}

export async function updateFood(id: string, input: UpdateFoodInput): Promise<UpdateFoodResponse> {
  const res = await api.api.admin.foods[":id"].$put({ param: { id }, json: input });
  return unwrap<UpdateFoodResponse>(res, "Gagal memperbarui bahan custom.");
}

export async function deleteFood(id: string): Promise<{ ok: true }> {
  const res = await api.api.admin.foods[":id"].$delete({ param: { id } });
  return unwrap<{ ok: true }>(res, "Gagal menghapus bahan custom.");
}

export async function fetchSchools(sppgId?: string): Promise<SchoolListResponse> {
  const res = await api.api.admin.schools.$get({ query: { sppgId } });
  return unwrap<SchoolListResponse>(res, "Gagal memuat daftar sekolah.");
}

export async function createSchool(input: CreateSchoolInput): Promise<CreateSchoolResponse> {
  const res = await api.api.admin.schools.$post({ json: input });
  return unwrap<CreateSchoolResponse>(res, "Gagal menambahkan sekolah.");
}

export async function updateSchool(
  id: string,
  input: UpdateSchoolInput,
): Promise<UpdateSchoolResponse> {
  const res = await api.api.admin.schools[":id"].$put({ param: { id }, json: input });
  return unwrap<UpdateSchoolResponse>(res, "Gagal memperbarui data sekolah.");
}

export async function deleteSchool(id: string): Promise<{ ok: true }> {
  const res = await api.api.admin.schools[":id"].$delete({ param: { id } });
  return unwrap<{ ok: true }>(res, "Gagal menghapus sekolah.");
}

export function getSchoolQrUrl(id: string, format: "png" | "svg", size = 320): string {
  return `/api/admin/schools/${encodeURIComponent(id)}/qr?format=${format}&size=${size}`;
}

export async function downloadSchoolQr(
  id: string,
  slug: string,
  format: "png" | "svg",
): Promise<void> {
  const res = await fetch(getSchoolQrUrl(id, format, 600), { credentials: "include" });
  if (!res.ok) {
    throw new Error("Gagal mengunduh berkas QR.");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `qr-${slug}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function createSppg(input: CreateSppgInput): Promise<CreateSppgResponse> {
  const res = await api.api.admin.sppg.$post({ json: input });
  return unwrap<CreateSppgResponse>(res, "Gagal menambahkan SPPG.");
}

export async function updateSppg(id: string, input: UpdateSppgInput): Promise<UpdateSppgResponse> {
  const res = await api.api.admin.sppg[":id"].$put({ param: { id }, json: input });
  return unwrap<UpdateSppgResponse>(res, "Gagal memperbarui SPPG.");
}

export async function deleteSppg(id: string): Promise<{ ok: true }> {
  const res = await api.api.admin.sppg[":id"].$delete({ param: { id } });
  return unwrap<{ ok: true }>(res, "Gagal menghapus SPPG.");
}
