import { useCallback, useEffect, useState } from "react";
import { isIosSafari } from "../lib/pwa-helpers";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const LAST_ONLINE_STORAGE_KEY = "mbg.last_online_at";

function readLastOnlineTimestamp(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_ONLINE_STORAGE_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

function writeLastOnlineTimestamp(ts: number): void {
  try {
    window.localStorage.setItem(LAST_ONLINE_STORAGE_KEY, String(ts));
  } catch {
    // Ignore storage quota / private mode restrictions.
  }
}

/** Track `navigator.onLine` + last online timestamp for offline status indicators. */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = readLastOnlineTimestamp();
    if (stored) return stored;
    if (navigator.onLine) {
      const now = Date.now();
      writeLastOnlineTimestamp(now);
      return now;
    }
    return null;
  });

  useEffect(() => {
    const handleOnline = () => {
      const now = Date.now();
      setIsOnline(true);
      setLastUpdatedAt(now);
      writeLastOnlineTimestamp(now);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastUpdatedAt };
}

/** Capture `beforeinstallprompt` and expose manual install action + iOS Safari fallback flag. */
let cachedDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    cachedDeferredPrompt = event as BeforeInstallPromptEvent;
  });
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => cachedDeferredPrompt,
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      cachedDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const onAppInstalled = () => {
      cachedDeferredPrompt = null;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const target = deferredPrompt ?? cachedDeferredPrompt;
    if (!target) return false;
    await target.prompt();
    const choice = await target.userChoice;
    cachedDeferredPrompt = null;
    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const showIosGuide =
    typeof navigator !== "undefined" &&
    !deferredPrompt &&
    isIosSafari(navigator.userAgent, isInstalled);

  return {
    canInstall: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    showIosGuide,
    promptInstall,
  };
}
