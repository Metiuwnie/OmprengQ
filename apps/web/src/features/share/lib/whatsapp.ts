import type { Allergen, NutrientTotals } from "@mbg/shared";
import { ALLERGEN_LABELS, formatDateId } from "@/features/admin/lib/labels";

export const MAX_WA_MESSAGE_LENGTH = 700;

export interface WhatsAppMenuInput {
  date: string;
  name: string;
  totals?: NutrientTotals | null;
  allergens?: readonly Allergen[];
}

export interface WhatsAppSchoolInput {
  name: string;
  slug: string;
  greeting?: string | null;
}

function truncateText(value: string, maxLen: number): string {
  if (maxLen <= 1) return "…";
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 1).trimEnd()}…`;
}

/**
 * Pure WhatsApp parent-group message builder (<= 700 chars).
 * Uses the `/api/og/s/:slug/hari-ini?to=kalkulator` link so WhatsApp displays a rich OG preview
 * and redirects parents directly to `/kalkulator?school=:slug`.
 */
export function buildWhatsAppMessage(
  menu: WhatsAppMenuInput | null,
  school: WhatsAppSchoolInput,
  baseUrl: string,
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const shareUrl = `${cleanBase}/api/og/s/${encodeURIComponent(school.slug)}/hari-ini?to=kalkulator`;

  if (!menu) {
    const lines = [
      `🍽️ Info Menu MBG ${school.name}`,
      "Hari ini belum ada jadwal menu MBG yang terbit.",
      "",
      "Cek kebutuhan gizi anak & saran menu di rumah:",
      shareUrl,
    ];
    return truncateText(lines.join("\n"), MAX_WA_MESSAGE_LENGTH);
  }

  const dateLabel = formatDateId(menu.date, true);
  const headerLine = school.greeting?.trim()
    ? `${school.greeting.trim()} (${dateLabel})`
    : `🍱 Menu MBG hari ini - ${dateLabel}`;

  const nutritionLine = menu.totals
    ? `✨ Sorotan gizi: energi ${Math.round(menu.totals.energyKcal)} kkal • protein ${menu.totals.proteinG.toFixed(1)} g • serat ${menu.totals.fiberG.toFixed(1)} g`
    : null;

  const allergenLine =
    menu.allergens && menu.allergens.length > 0
      ? `⚠️ Mengandung: ${menu.allergens.map((a) => ALLERGEN_LABELS[a].toLowerCase()).join(", ")}`
      : null;

  const footerLines = [
    "",
    "Cek kebutuhan gizi anak & saran menu di rumah:",
    shareUrl,
  ];

  const assemble = (menuName: string): string => {
    const body: string[] = [headerLine, menuName];
    if (nutritionLine || allergenLine) body.push("");
    if (nutritionLine) body.push(nutritionLine);
    if (allergenLine) body.push(allergenLine);
    body.push(...footerLines);
    return body.join("\n");
  };

  const full = assemble(menu.name.trim());
  if (full.length <= MAX_WA_MESSAGE_LENGTH) {
    return full;
  }

  const overhead = full.length - menu.name.trim().length;
  const maxMenuNameLen = Math.max(24, MAX_WA_MESSAGE_LENGTH - overhead);
  const clipped = assemble(truncateText(menu.name.trim(), maxMenuNameLen));

  return clipped.length <= MAX_WA_MESSAGE_LENGTH
    ? clipped
    : truncateText(clipped, MAX_WA_MESSAGE_LENGTH);
}

/** Build `https://wa.me/?text=...` URL with full URI encoding for special characters. */
export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
