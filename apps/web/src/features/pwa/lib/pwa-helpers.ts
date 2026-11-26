/** Format a `Date` to local `YYYY-MM-DD` string. */
export function toLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Return true when a cached menu date (`YYYY-MM-DD`) is strictly older than today's local date. */
export function isMenuDateStale(
  menuDateIso: string | null | undefined,
  now = new Date(),
): boolean {
  if (!menuDateIso || !/^\d{4}-\d{2}-\d{2}$/.test(menuDateIso)) {
    return false;
  }
  return menuDateIso < toLocalIsoDate(now);
}

/** Format a local timestamp (`ms`) into compact Indonesian time label. */
export function formatLastUpdatedLabel(timestampMs: number | null | undefined): string {
  if (!timestampMs || !Number.isFinite(timestampMs)) {
    return "baru saja";
  }
  try {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestampMs));
  } catch {
    return "baru saja";
  }
}

/** Detect iOS Safari when not already installed in standalone display mode. */
export function isIosSafari(userAgent: string, isStandalone: boolean): boolean {
  if (isStandalone || !userAgent) return false;
  const isIos = /iPad|iPhone|iPod/i.test(userAgent);
  const isWebKit = /WebKit/i.test(userAgent);
  const isOtherIosBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/i.test(userAgent);
  return isIos && isWebKit && !isOtherIosBrowser;
}

/** Politely ask browser for persistent localStorage/CacheStorage without forcing. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }
  try {
    const alreadyPersisted = await navigator.storage.persisted?.();
    if (alreadyPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
