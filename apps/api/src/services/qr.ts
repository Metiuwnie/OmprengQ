import QRCode from "qrcode";
import { getAppBaseUrl } from "../lib/env.js";

export type QrFormat = "png" | "svg";

export const QR_MIN_SIZE = 128;
export const QR_MAX_SIZE = 1024;
export const QR_DEFAULT_SIZE = 320;

/** Public "today's menu" URL that a school QR code points at. */
export function buildSchoolTodayUrl(slug: string, baseUrl: string = getAppBaseUrl()): string {
  return `${baseUrl.replace(/\/+$/, "")}/s/${slug}/hari-ini`;
}

export function clampQrSize(size: number | undefined): number {
  if (size === undefined || !Number.isFinite(size)) return QR_DEFAULT_SIZE;
  return Math.min(QR_MAX_SIZE, Math.max(QR_MIN_SIZE, Math.round(size)));
}

/** Generate a printable QR for a school. Returns a PNG buffer or an SVG string. */
export async function generateSchoolQr(options: {
  slug: string;
  format: QrFormat;
  size?: number;
  baseUrl?: string;
}): Promise<Buffer | string> {
  const url = buildSchoolTodayUrl(options.slug, options.baseUrl);
  const size = clampQrSize(options.size);

  if (options.format === "svg") {
    return QRCode.toString(url, { type: "svg", margin: 2, width: size, errorCorrectionLevel: "M" });
  }
  return QRCode.toBuffer(url, { type: "png", margin: 2, width: size, errorCorrectionLevel: "M" });
}
