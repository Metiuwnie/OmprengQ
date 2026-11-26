import { describe, expect, it } from "vitest";
import {
  computeBadges,
  computeStreak,
  generateDailyQuiz,
  getDailyMissions,
  getWeeklySdgSpotlight,
} from "./gamification-engine";

describe("gamification-engine", () => {
  it("generates 3 quiz questions from today's menu without weight/restriction framing", () => {
    const questions = generateDailyQuiz(
      "Nasi, Ayam Goreng, Bayam",
      [
        { label: "Nasi putih", category: "karbohidrat" },
        { label: "Ayam goreng", category: "lauk_hewani" },
        { label: "Sayur bayam", category: "sayur" },
      ],
      { energyKcal: 620, proteinG: 26, fatG: 16, carbG: 88, fiberG: 6, ironMg: 4.2 },
      "sd_low",
    );

    expect(questions).toHaveLength(3);
    for (const q of questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.positiveFeedback.length).toBeGreaterThan(0);
    }
  });

  it("computes consecutive streaks accurately", () => {
    expect(computeStreak(["2026-11-24", "2026-11-25", "2026-11-26"], "2026-11-26")).toBe(3);
    expect(computeStreak(["2026-11-23", "2026-11-25"], "2026-11-26")).toBe(1);
    expect(computeStreak(["2026-11-20"], "2026-11-26")).toBe(0);
  });

  it("unlocks thematic badges per profile progress", () => {
    const badges = computeBadges(
      {
        completedDates: ["2026-11-24", "2026-11-25", "2026-11-26"],
        checkedMissionsByDate: { "2026-11-26": ["habiskan_sayur"] },
        completedQuizDates: ["2026-11-26"],
        unlockedCards: [
          { name: "Ayam goreng", category: "lauk_hewani", fact: "Tinggi protein", unlockedDate: "2026-11-26" },
          { name: "Sayur bayam", category: "sayur", fact: "Kaya serat", unlockedDate: "2026-11-26" },
        ],
      },
      "2026-11-26",
    );

    expect(badges.every((b) => b.earned)).toBe(true);
  });

  it("returns weekly rotating SDG spotlight", () => {
    const spot = getWeeklySdgSpotlight("2026-11-26");
    expect(spot.weekNumber).toBeGreaterThan(0);
    expect(spot.sdgTag).toContain("SDG");
  });

  it("builds 3 menu-aware daily missions", () => {
    const missions = getDailyMissions(
      [
        { label: "Nasi putih", category: "karbohidrat" },
        { label: "Brokoli rebus / kukus", category: "sayur" },
      ],
      "sd_low",
    );

    expect(missions).toHaveLength(3);
    expect(missions[0]?.label).toContain("Brokoli rebus / kukus");
    expect(missions[2]?.label).toContain("buah segar");
  });
});
