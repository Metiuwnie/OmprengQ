import type {
  CreateFoodInput,
  CreateSchoolInput,
  CreateSppgInput,
  UpdateFoodInput,
  UpdateSchoolInput,
  UpdateSppgInput,
} from "@mbg/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFood,
  createSchool,
  createSppg,
  deleteFood,
  deleteSchool,
  deleteSppg,
  fetchSchools,
  updateFood,
  updateSchool,
  updateSppg,
} from "../api/admin-api";

export function useSchoolsQuery(sppgId?: string, enabled = true) {
  return useQuery({
    queryKey: ["admin", "schools", sppgId ?? "own"],
    queryFn: () => fetchSchools(sppgId),
    enabled,
  });
}

export function useCreateSchoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSchoolInput) => createSchool(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "schools"] }),
  });
}

export function useUpdateSchoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; input: UpdateSchoolInput }) =>
      updateSchool(payload.id, payload.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "schools"] }),
  });
}

export function useDeleteSchoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchool(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "schools"] }),
  });
}

export function useCreateFoodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFoodInput) => createFood(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "foods"] }),
  });
}

export function useUpdateFoodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; input: UpdateFoodInput }) =>
      updateFood(payload.id, payload.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "foods"] }),
  });
}

export function useDeleteFoodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "foods"] }),
  });
}

export function useCreateSppgMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSppgInput) => createSppg(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sppg"] }),
  });
}

export function useUpdateSppgMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; input: UpdateSppgInput }) =>
      updateSppg(payload.id, payload.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sppg"] }),
  });
}

export function useDeleteSppgMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSppg(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sppg"] }),
  });
}
