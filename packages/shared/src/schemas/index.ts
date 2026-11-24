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

// ---------------------------------------------------------------------------
// M2: SPPG, schools, foods, menus
// ---------------------------------------------------------------------------

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const SCHOOL_TIMEZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;
export type SchoolTimezone = (typeof SCHOOL_TIMEZONES)[number];

/** Turn a school name into a lowercase-digits-hyphen slug (e.g. "SDN 01 Semarang" -> "sdn-01-semarang"). */
export function slugifySchoolName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}

/** Optional free text: undefined stays undefined (no change), empty string becomes null. */
function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .nullish()
    .transform((value) => (value === undefined ? undefined : value ? value : null));
}

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Format tautan tidak valid").max(500)])
  .nullish()
  .transform((value) => (value === undefined ? undefined : value ? value : null));

const nonNegative = (label: string) =>
  z.number({ invalid_type_error: `${label} harus berupa angka` }).min(0, `${label} tidak boleh negatif`).max(100000);

const sppgIdField = z.string().uuid("ID SPPG tidak valid").optional();

export const createSppgSchema = z.object({
  name: z.string().trim().min(1, "Nama SPPG wajib diisi").max(200),
  region: optionalText(200),
});
export const updateSppgSchema = createSppgSchema.partial();
export type CreateSppgInput = z.infer<typeof createSppgSchema>;
export type UpdateSppgInput = z.infer<typeof updateSppgSchema>;

export const createSchoolSchema = z.object({
  sppgId: sppgIdField,
  name: z.string().trim().min(1, "Nama sekolah wajib diisi").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_REGEX, "Slug hanya boleh huruf kecil, angka, dan tanda strip")
    .max(100)
    .optional(),
  levels: z.array(levelSchema).min(1, "Pilih minimal satu jenjang"),
  timezone: z.enum(SCHOOL_TIMEZONES).default("Asia/Jakarta"),
  active: z.boolean().default(true),
});
export const updateSchoolSchema = createSchoolSchema.omit({ sppgId: true }).partial();
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;

export const createFoodSchema = z.object({
  code: z
    .string()
    .trim()
    .max(50)
    .nullish()
    .transform((value) => (value === undefined ? undefined : value ? value : null)),
  name: z.string().trim().min(1, "Nama bahan wajib diisi").max(200),
  category: foodCategorySchema,
  energyKcal: nonNegative("Energi"),
  proteinG: nonNegative("Protein"),
  fatG: nonNegative("Lemak"),
  carbG: nonNegative("Karbohidrat"),
  fiberG: nonNegative("Serat"),
  ironMg: nonNegative("Zat besi"),
  ediblePct: z.number().min(0).max(100).default(100),
  allergens: z.array(allergenSchema).default([]),
});
export const updateFoodSchema = createFoodSchema.partial();
export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;

const dateString = z
  .string()
  .regex(DATE_REGEX, "Format tanggal harus YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Tanggal tidak valid");

export const createMenuSchema = z.object({
  sppgId: sppgIdField,
  date: dateString,
  name: z.string().trim().min(1, "Nama menu wajib diisi").max(300),
  description: optionalText(2000),
  photoUrl: optionalUrl,
  funFact: optionalText(1000),
});
export const updateMenuSchema = createMenuSchema.omit({ sppgId: true }).partial();
export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

export const portionItemInputSchema = z.object({
  foodId: z.string().uuid("ID bahan tidak valid"),
  grams: z
    .number({ invalid_type_error: "Gram harus berupa angka" })
    .gt(0, "Gram harus lebih dari 0")
    .max(1000, "Gram maksimal 1000"),
  label: optionalText(200),
  visualUnit: optionalText(100),
  benefit: optionalText(300),
});
export type PortionItemFormInput = z.infer<typeof portionItemInputSchema>;

export const putPortionSchema = z.object({
  items: z.array(portionItemInputSchema).max(40, "Maksimal 40 bahan per porsi"),
});
export type PutPortionInput = z.infer<typeof putPortionSchema>;

export const copyMenuSchema = z.object({
  menuId: z.string().uuid("ID menu tidak valid"),
  targetDate: dateString,
});
export type CopyMenuInput = z.infer<typeof copyMenuSchema>;
