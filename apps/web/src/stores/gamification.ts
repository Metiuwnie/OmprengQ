import { create } from "zustand";
import {
  pickCardToUnlock,
  type ProfileGamificationProgress,
  type QuizMenuItem,
} from "../features/gamification/lib/gamification-engine";

export const GAMIFICATION_STORAGE_KEY = "mbg.progress.v1";

const EMPTY_PROGRESS: ProfileGamificationProgress = {
  completedDates: [],
  checkedMissionsByDate: {},
  completedQuizDates: [],
  unlockedCards: [],
};

interface GamificationStoreState {
  byProfile: Record<string, ProfileGamificationProgress>;
  storageUnavailable: boolean;
  toggleMission: (profileId: string, dateIso: string, missionId: string) => void;
  markQuizCompleted: (
    profileId: string,
    dateIso: string,
    menuItems: readonly QuizMenuItem[],
  ) => void;
}

function readInitialProgress(): {
  byProfile: Record<string, ProfileGamificationProgress>;
  storageUnavailable: boolean;
} {
  try {
    const raw = window.localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return { byProfile: {}, storageUnavailable: false };
    const parsed = JSON.parse(raw) as Record<string, ProfileGamificationProgress>;
    if (!parsed || typeof parsed !== "object") {
      return { byProfile: {}, storageUnavailable: false };
    }
    return { byProfile: parsed, storageUnavailable: false };
  } catch {
    return { byProfile: {}, storageUnavailable: true };
  }
}

function persistProgress(byProfile: Record<string, ProfileGamificationProgress>): boolean {
  try {
    window.localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(byProfile));
    return true;
  } catch {
    return false;
  }
}

function getProfileProgress(
  byProfile: Record<string, ProfileGamificationProgress>,
  profileId: string,
): ProfileGamificationProgress {
  return byProfile[profileId] ?? EMPTY_PROGRESS;
}

const initial = typeof window !== "undefined"
  ? readInitialProgress()
  : { byProfile: {}, storageUnavailable: false };

/** Local-only gamification store (`mbg.progress.v1`), keyed per profile and never sent to server. */
export const useGamificationStore = create<GamificationStoreState>((set, get) => ({
  byProfile: initial.byProfile,
  storageUnavailable: initial.storageUnavailable,

  toggleMission: (profileId, dateIso, missionId) => {
    const current = getProfileProgress(get().byProfile, profileId);
    const prevChecked = current.checkedMissionsByDate[dateIso] ?? [];
    const exists = prevChecked.includes(missionId);
    const nextChecked = exists
      ? prevChecked.filter((id) => id !== missionId)
      : [...prevChecked, missionId];

    const completedDates = nextChecked.length > 0
      ? Array.from(new Set([...current.completedDates, dateIso]))
      : current.completedQuizDates.includes(dateIso)
        ? current.completedDates
        : current.completedDates.filter((d) => d !== dateIso);

    const nextProfile: ProfileGamificationProgress = {
      ...current,
      completedDates,
      checkedMissionsByDate: {
        ...current.checkedMissionsByDate,
        [dateIso]: nextChecked,
      },
    };
    const nextByProfile = { ...get().byProfile, [profileId]: nextProfile };
    const ok = persistProgress(nextByProfile);
    set({ byProfile: nextByProfile, storageUnavailable: !ok });
  },

  markQuizCompleted: (profileId, dateIso, menuItems) => {
    const current = getProfileProgress(get().byProfile, profileId);
    const nextQuizDates = Array.from(new Set([...current.completedQuizDates, dateIso]));
    const nextCompletedDates = Array.from(new Set([...current.completedDates, dateIso]));
    const newCard = pickCardToUnlock(
      menuItems,
      current.unlockedCards.map((c) => c.name),
      dateIso,
    );
    const nextCards = newCard ? [...current.unlockedCards, newCard] : current.unlockedCards;

    const nextProfile: ProfileGamificationProgress = {
      ...current,
      completedDates: nextCompletedDates,
      completedQuizDates: nextQuizDates,
      unlockedCards: nextCards,
    };
    const nextByProfile = { ...get().byProfile, [profileId]: nextProfile };
    const ok = persistProgress(nextByProfile);
    set({ byProfile: nextByProfile, storageUnavailable: !ok });
  },
}));
