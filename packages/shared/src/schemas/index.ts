import { z } from "zod";
import {
  ALLERGENS,
  FOOD_CATEGORIES,
  LEVELS,
  MEAL_SLOTS,
  ROLES,
  SEXES,
} from "../constants/index.js";

export const levelSchema = z.enum(LEVELS);
export const roleSchema = z.enum(ROLES);
export const sexSchema = z.enum(SEXES);
export const foodCategorySchema = z.enum(FOOD_CATEGORIES);
export const mealSlotSchema = z.enum(MEAL_SLOTS);
export const allergenSchema = z.enum(ALLERGENS);

export const healthResponseSchema = z.object({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: roleSchema,
  sppgId: z.string().nullable(),
  schoolId: z.string().nullable(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
