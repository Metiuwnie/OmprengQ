import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ALLERGENS, FOOD_CATEGORIES, type Allergen, type FoodCategory } from "@mbg/shared";
import { z } from "zod";

export const foodSeedItemSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum(FOOD_CATEGORIES),
  energyKcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  carbG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
  ironMg: z.number().nonnegative(),
  ediblePct: z.number().min(0).max(100),
  allergens: z.array(z.enum(ALLERGENS)),
  verified: z.boolean().optional(),
  todo: z.string().optional(),
});

export type FoodSeedItem = z.infer<typeof foodSeedItemSchema>;

const CATEGORY_SET = new Set<string>(FOOD_CATEGORIES);
const ALLERGEN_SET = new Set<string>(ALLERGENS);

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  result.push(current.trim());
  return result;
}

function parseNumber(raw: string | undefined): number {
  const normalized = (raw ?? "0").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Parse CSV TKPI (header: code,name,category,energyKcal,proteinG,fatG,carbG,fiberG,ironMg,ediblePct,allergens)
 * menjadi daftar item `foods.tkpi.json` yang tervalidasi Zod.
 */
export function parseTkpiCsv(csvText: string): FoodSeedItem[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0] ?? "").map((h) => h.toLowerCase());
  const indexOf = (key: string) => headers.indexOf(key.toLowerCase());

  return lines.slice(1).map((line, idx) => {
    const cols = splitCsvLine(line);
    const get = (key: string) => cols[indexOf(key)] ?? "";
    const rawCategory = get("category").toLowerCase();
    const category: FoodCategory = CATEGORY_SET.has(rawCategory)
      ? (rawCategory as FoodCategory)
      : "lainnya";

    const allergens = get("allergens")
      .split(/[;|]/)
      .map((item) => item.trim().toLowerCase())
      .filter((item): item is Allergen => ALLERGEN_SET.has(item));

    const code = get("code") || `TKPI-CSV-${idx + 1}`;
    return foodSeedItemSchema.parse({
      code,
      name: get("name"),
      category,
      energyKcal: parseNumber(get("energyKcal")),
      proteinG: parseNumber(get("proteinG")),
      fatG: parseNumber(get("fatG")),
      carbG: parseNumber(get("carbG")),
      fiberG: parseNumber(get("fiberG")),
      ironMg: parseNumber(get("ironMg")),
      ediblePct: parseNumber(get("ediblePct")) || 100,
      allergens,
      verified: true,
    });
  });
}

const isCli =
  process.argv[1] &&
  (process.argv[1].endsWith("import-tkpi-csv.ts") || process.argv[1].endsWith("import-tkpi-csv.js"));

if (isCli) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? resolve(process.cwd(), "src/db/seed/foods.tkpi.json");

  if (!inputPath) {
    console.error("Usage: tsx src/db/seed/import-tkpi-csv.ts <input.csv> [output.json]");
    process.exit(1);
  }

  const csvContent = readFileSync(resolve(process.cwd(), inputPath), "utf8");
  const parsed = parseTkpiCsv(csvContent);
  writeFileSync(resolve(process.cwd(), outputPath), `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  console.log(`Imported ${parsed.length} TKPI items to ${outputPath}`);
}
