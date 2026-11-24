import type {
  CopyMenuInput,
  CreateMenuInput,
  FoodCategory,
  Level,
  PortionItemFormInput,
  UpdateMenuInput,
} from "@mbg/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  copyMenu,
  createMenu,
  deleteMenu,
  fetchMenuDetail,
  fetchMenus,
  fetchSppgList,
  publishMenu,
  saveMenuPortion,
  searchFoods,
  updateMenu,
} from "../api/admin-api";

export function useSppgList(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "sppg"],
    queryFn: fetchSppgList,
    enabled,
    staleTime: 60_000,
  });
}

export function useMenusQuery(params: { from: string; to: string; sppgId?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "menus", params.from, params.to, params.sppgId ?? "own"],
    queryFn: () => fetchMenus({ from: params.from, to: params.to, sppgId: params.sppgId }),
    enabled: params.enabled ?? true,
  });
}

export function useMenuDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "menu", id],
    queryFn: () => fetchMenuDetail(id!),
    enabled: Boolean(id),
  });
}

export function useFoodSearchQuery(q: string, category?: FoodCategory, limit = 25) {
  return useQuery({
    queryKey: ["admin", "foods", q, category ?? "all", limit],
    queryFn: () => searchFoods({ q, category, limit }),
    staleTime: 30_000,
  });
}

export function useCreateMenuMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMenuInput) => createMenu(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "menus"] }),
  });
}

export function useUpdateMenuMutation(menuId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMenuInput) => updateMenu(menuId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu", menuId] });
      qc.invalidateQueries({ queryKey: ["admin", "menus"] });
    },
  });
}

export function useSavePortionMutation(menuId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { level: Level; items: PortionItemFormInput[] }) =>
      saveMenuPortion(menuId, payload.level, payload.items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu", menuId] });
      qc.invalidateQueries({ queryKey: ["admin", "menus"] });
    },
  });
}

export function usePublishMenuMutation(menuId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishMenu(menuId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu", menuId] });
      qc.invalidateQueries({ queryKey: ["admin", "menus"] });
    },
  });
}

export function useCopyMenuMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CopyMenuInput) => copyMenu(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "menus"] }),
  });
}

export function useDeleteMenuMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; confirm: boolean }) => deleteMenu(payload.id, payload.confirm),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "menus"] }),
  });
}
