import type { UsageEventType } from "@mbg/shared";

/**
 * Fire-and-forget anonymous usage event tracker (`POST /api/public/events`).
 * Strictly sends ONLY `{ schoolSlug, date, type }` — never child/profile/identity data.
 */
export function trackAnonymousEvent(payload: {
  schoolSlug: string;
  date: string;
  type: UsageEventType;
}): void {
  if (typeof window === "undefined") return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  void fetch("/api/public/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      schoolSlug: payload.schoolSlug,
      date: payload.date,
      type: payload.type,
    }),
    keepalive: true,
  }).catch(() => {
    // Ignore offline/network errors silently; gamification and UI never block on telemetry.
  });
}
