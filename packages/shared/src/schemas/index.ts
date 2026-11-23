import { z } from "zod";
import { ALLERGENS, LEVELS } from "../constants/index.js";

export const levelSchema = z.enum(LEVELS);
export const allergenSchema = z.enum(ALLERGENS);

export const healthResponseSchema = z.object({
  ok: z.literal(true),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
