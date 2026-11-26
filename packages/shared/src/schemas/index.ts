import { z } from "zod";
import {
  ACTIVITIES,
  ALLERGENS,
  FOOD_CATEGORIES,
  LEVELS,
  MEAL_SLOTS,
  ROLES,
  SEXES,
  USAGE_EVENT_TYPES,
} from "../constants/index.js";

export const levelSchema = z.enum(LEVELS);
export const roleSchema = z.enum(ROLES);
export const sexSchema = z.enum(SEXES);
export const activityLevelSchema = z.enum(ACTIVITIES);
export const foodCategorySchema = z.enum(FOOD_CATEGORIES);
export const mealSlotSchema = z.enum(MEAL_SLOTS);
export const allergenSchema = z.enum(ALLERGENS);

export const healthResponseSchema = z.object({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Username atau email wajib diisi"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().min(1),
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

// ---------------------------------------------------------------------------
// M4: Local child profile (never sent over network)
// ---------------------------------------------------------------------------

export const ChildProfileSchema = z.object({
  id: z.string().trim().min(1, "ID profil wajib diisi").max(100),
  nickname: z
    .string()
    .trim()
    .min(1, "Nama panggilan wajib diisi")
    .max(50, "Nama panggilan maksimal 50 karakter"),
  age: z
    .number({ invalid_type_error: "Usia harus berupa angka" })
    .int("Usia harus bilangan bulat")
    .min(4, "Usia minimal 4 tahun")
    .max(18, "Usia maksimal 18 tahun"),
  sex: sexSchema,
  weightKg: z
    .number({ invalid_type_error: "Berat badan harus berupa angka" })
    .min(10, "Berat badan minimal 10 kg")
    .max(120, "Berat badan maksimal 120 kg"),
  heightCm: z
    .number({ invalid_type_error: "Tinggi badan harus berupa angka" })
    .min(80, "Tinggi badan minimal 80 cm")
    .max(200, "Tinggi badan maksimal 200 cm"),
  activity: activityLevelSchema,
  allergies: z.array(allergenSchema).default([]),
  dislikes: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  level: levelSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type ChildProfile = z.infer<typeof ChildProfileSchema>;

export const ChildProfileInputSchema = ChildProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ChildProfileInput = z.infer<typeof ChildProfileInputSchema>;

export const ProfileExportSchema = z.object({
  schemaVersion: z.literal(1),
  activeId: z.string().nullable().optional().default(null),
  profiles: z.array(ChildProfileSchema),
});
export type ProfileExportPayload = z.infer<typeof ProfileExportSchema>;

/** Validate a single child profile object with Zod. */
export function validateChildProfile(input: unknown) {
  return ChildProfileSchema.safeParse(input);
}

/** Validate an exported/imported `profil-gizi.json` payload with Zod. */
export function validateProfileExport(input: unknown) {
  return ProfileExportSchema.safeParse(input);
}

// ---------------------------------------------------------------------------
// M9: Anonymous aggregate usage events & admin report filters
// ---------------------------------------------------------------------------

export const usageEventTypeSchema = z.enum(USAGE_EVENT_TYPES);

/** Strictly accepts only schoolSlug, date, and event type (never profile/identity data). */
export const usageEventInputSchema = z
  .object({
    schoolSlug: z.string().trim().min(1).max(120),
    date: dateString,
    type: usageEventTypeSchema,
  })
  .strict();
export type UsageEventInput = z.infer<typeof usageEventInputSchema>;

export const reportQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  sppgId: z.string().uuid("ID SPPG tidak valid").optional(),
  schoolId: z.string().uuid("ID sekolah tidak valid").optional(),
});
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
