import type { Level, NutrientTotals } from "@mbg/shared";
import {
  Apple,
  Award,
  CheckCircle2,
  Droplets,
  Flame,
  HelpCircle,
  Layers,
  Lock,
  PartyPopper,
  RotateCcw,
  Salad,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/features/public/components/category-icon";
import { trackAnonymousEvent } from "@/features/public/lib/usage-events";
import { useGamificationStore } from "@/stores/gamification";
import {
  computeBadges,
  computeStreak,
  type DailyMission,
  generateDailyQuiz,
  getDailyMissions,
  type QuizMenuItem,
} from "../lib/gamification-engine";

interface GamificationPanelProps {
  profileId: string;
  schoolSlug: string;
  menuDate: string;
  menuName: string;
  items: readonly QuizMenuItem[];
  totals: NutrientTotals;
  level: Level;
}

type ActiveTab = "quiz" | "missions" | "cards";

const CONFETTI_PIECES = [
  { left: "12%", top: "48%", cx: "-56px", cy: "-96px", rot: "-140deg", color: "bg-primary" },
  { left: "20%", top: "44%", cx: "-32px", cy: "-115px", rot: "160deg", color: "bg-accent" },
  { left: "28%", top: "52%", cx: "-72px", cy: "-72px", rot: "-200deg", color: "bg-sky" },
  { left: "36%", top: "46%", cx: "-18px", cy: "-124px", rot: "120deg", color: "bg-coral" },
  { left: "44%", top: "50%", cx: "16px", cy: "-118px", rot: "-160deg", color: "bg-accent" },
  { left: "50%", top: "44%", cx: "0px", cy: "-132px", rot: "210deg", color: "bg-primary" },
  { left: "56%", top: "48%", cx: "28px", cy: "-110px", rot: "-130deg", color: "bg-sky" },
  { left: "64%", top: "52%", cx: "54px", cy: "-92px", rot: "175deg", color: "bg-coral" },
  { left: "72%", top: "46%", cx: "72px", cy: "-76px", rot: "-190deg", color: "bg-accent" },
  { left: "80%", top: "50%", cx: "44px", cy: "-118px", rot: "145deg", color: "bg-primary" },
  { left: "24%", top: "62%", cx: "-48px", cy: "-84px", rot: "190deg", color: "bg-coral" },
  { left: "38%", top: "64%", cx: "-22px", cy: "-102px", rot: "-155deg", color: "bg-sky" },
  { left: "62%", top: "62%", cx: "32px", cy: "-104px", rot: "165deg", color: "bg-primary" },
  { left: "76%", top: "64%", cx: "58px", cy: "-82px", rot: "-170deg", color: "bg-accent" },
  { left: "48%", top: "60%", cx: "-10px", cy: "-108px", rot: "135deg", color: "bg-sky" },
  { left: "54%", top: "60%", cx: "14px", cy: "-98px", rot: "-145deg", color: "bg-coral" },
] as const;

function ConfettiBurst({ burstKey }: { burstKey: number }) {
  if (burstKey === 0) return null;
  return (
    <div
      key={burstKey}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {CONFETTI_PIECES.map((piece, idx) => {
        const style = {
          left: piece.left,
          top: piece.top,
          "--cx": piece.cx,
          "--cy": piece.cy,
          "--rot": piece.rot,
        } as CSSProperties;
        return (
          <span
            key={idx}
            style={style}
            className={`confetti-piece absolute h-3 w-3 rounded-sm ${piece.color} shadow-sm`}
          />
        );
      })}
    </div>
  );
}

function MissionIcon({ iconKey }: { iconKey: DailyMission["iconKey"] }) {
  if (iconKey === "veggie") return <Salad className="h-4 w-4" aria-hidden="true" />;
  if (iconKey === "water") return <Droplets className="h-4 w-4" aria-hidden="true" />;
  return <Apple className="h-4 w-4" aria-hidden="true" />;
}

/** Local-first nutrition quiz, daily missions, streak & food collection cards (`mbg.progress.v1`). */
export function GamificationPanel({
  profileId,
  schoolSlug,
  menuDate,
  menuName,
  items,
  totals,
  level,
}: GamificationPanelProps) {
  const [tab, setTab] = useState<ActiveTab>("quiz");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(null);

  const byProfile = useGamificationStore((s) => s.byProfile);
  const toggleMission = useGamificationStore((s) => s.toggleMission);
  const markQuizCompleted = useGamificationStore((s) => s.markQuizCompleted);

  useEffect(() => {
    if (celebrationKey === 0) return;
    const timer = window.setTimeout(() => {
      setCelebrationKey(0);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [celebrationKey]);

  const progress = useMemo(
    () =>
      byProfile[profileId] ?? {
        completedDates: [],
        checkedMissionsByDate: {},
        completedQuizDates: [],
        unlockedCards: [],
      },
    [byProfile, profileId],
  );

  const questions = useMemo(
    () => generateDailyQuiz(menuName, items, totals, level),
    [menuName, items, totals, level],
  );
  const missions = useMemo(() => getDailyMissions(items, level), [items, level]);
  const streak = useMemo(
    () => computeStreak(progress.completedDates, menuDate),
    [progress.completedDates, menuDate],
  );
  const badges = useMemo(() => computeBadges(progress, menuDate), [progress, menuDate]);

  const checkedMissions = progress.checkedMissionsByDate[menuDate] ?? [];
  const completedMissionCount = missions.filter((m) => checkedMissions.includes(m.id)).length;
  const missionPercent =
    missions.length > 0 ? Math.round((completedMissionCount / missions.length) * 100) : 0;

  const quizAlreadyDone = progress.completedQuizDates.includes(menuDate);
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const allCorrect = correctCount === questions.length;

  const handleSelectOption = (questionId: string, optionIdx: number, correctIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    if (optionIdx === correctIndex) {
      setCelebrationKey((k) => k + 1);
    }
  };

  const handleFinishQuiz = () => {
    markQuizCompleted(profileId, menuDate, items);
    trackAnonymousEvent({ schoolSlug, date: menuDate, type: "quiz_done" });
    setCelebrationKey((k) => k + 1);
    setCelebrationBanner(
      "Hore! Semua jawaban benar & kartu pangan baru sudah terbuka di tab Kartu.",
    );
  };

  const handleToggleMission = (missionId: string) => {
    const wasChecked = checkedMissions.includes(missionId);
    toggleMission(profileId, menuDate, missionId);
    if (!wasChecked && completedMissionCount + 1 === missions.length) {
      setCelebrationKey((k) => k + 1);
      setCelebrationBanner("Hebat! Semua misi gizi hari ini sudah selesai kamu jalankan.");
    }
  };

  return (
    <section
      aria-label="Kuis dan misi gizi harian"
      className="clay-card relative space-y-4 overflow-hidden bg-gradient-to-br from-card via-card to-sky-soft/45 p-4 sm:p-6"
    >
      <ConfettiBurst burstKey={celebrationKey} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="mint">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Tersimpan Lokal
            </Badge>
            <Badge variant="accent">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              Streak {streak} hari
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Petualangan Gizi Hari Ini
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Menu aktivitas gizi"
          className="clay-well grid w-full grid-cols-3 gap-1.5 p-1.5 sm:inline-grid sm:w-auto sm:min-w-[360px]"
        >
          {(
            [
              { id: "quiz", label: "Kuis", Icon: HelpCircle },
              { id: "missions", label: "Misi", Icon: Target },
              { id: "cards", label: `Kartu (${progress.unlockedCards.length})`, Icon: Layers },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-4 text-center text-xs font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 sm:px-5 sm:text-sm ${
                  active
                    ? "bg-sky text-sky-foreground shadow-[var(--shadow-clay-sky)]"
                    : "text-foreground hover:bg-card/70"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {celebrationBanner && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-primary/35 bg-mint-soft px-4 py-3 text-xs font-semibold text-primary sm:text-sm"
        >
          <PartyPopper className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{celebrationBanner}</span>
        </div>
      )}

      {tab === "quiz" && (
        <div className="space-y-4">
          {quizAlreadyDone && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/35 bg-mint-soft px-4 py-3.5"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-primary sm:text-base">
                    Kamu sudah mengerjakan kuis hari ini!
                  </p>
                  <p className="text-xs text-foreground/85 sm:text-sm">
                    Kartu koleksi pangan hari ini sudah terbuka di tab Kartu. Kamu bisa kembali lagi
                    besok untuk kuis menu baru.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTab("cards")}
                className="w-full sm:w-auto"
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                Lihat Tab Kartu
              </Button>
            </div>
          )}

          {questions.map((question, qIdx) => {
            const picked = quizAlreadyDone ? question.correctIndex : answers[question.id];
            const hasPicked = typeof picked === "number";
            const isCorrect = picked === question.correctIndex;
            return (
              <div key={question.id} className="clay-well space-y-2.5 p-4">
                <p className="flex items-start gap-2 text-sm font-bold text-foreground sm:text-base">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
                  <span>
                    {qIdx + 1}. {question.prompt}
                  </span>
                </p>

                <div className="grid gap-2 sm:grid-cols-3">
                  {question.options.map((opt, idx) => {
                    const selected = picked === idx;
                    const optionCorrect = selected && isCorrect;
                    const optionWrong = selected && !isCorrect;
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={selected}
                        disabled={quizAlreadyDone}
                        onClick={() => handleSelectOption(question.id, idx, question.correctIndex)}
                        className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-90 sm:text-sm ${
                          optionCorrect
                            ? "border-primary bg-mint-soft text-foreground shadow-[var(--shadow-clay-pill)]"
                            : optionWrong
                              ? "border-coral bg-coral-soft/60 text-foreground"
                              : "border-border bg-background text-foreground hover:bg-sky-soft/60"
                        }`}
                      >
                        <span>{opt}</span>
                        {optionCorrect && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Benar
                          </span>
                        )}
                        {optionWrong && (
                          <RotateCcw
                            className="h-4 w-4 shrink-0 text-coral"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {hasPicked && isCorrect && (
                  <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-mint-soft/85 px-3 py-2 text-xs font-semibold text-primary sm:text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Benar! {question.positiveFeedback}</span>
                  </div>
                )}

                {hasPicked && !isCorrect && (
                  <div className="flex items-start gap-2 rounded-md border border-coral/35 bg-coral-soft/50 px-3 py-2 text-xs font-medium text-foreground sm:text-sm">
                    <RotateCcw
                      className="mt-0.5 h-4 w-4 shrink-0 text-coral"
                      aria-hidden="true"
                    />
                    <span>Belum tepat, yuk coba pilih jawaban yang lain!</span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {quizAlreadyDone
                ? "Kamu sudah mengerjakan kuis hari ini! Kartu pangan baru sudah terbuka di tab Kartu."
                : `Jawab benar semua 3 pertanyaan (${correctCount}/${questions.length} benar) untuk membuka kartu koleksi pangan.`}
            </p>
            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={!allCorrect || quizAlreadyDone}
              onClick={handleFinishQuiz}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {quizAlreadyDone ? "Kuis Selesai" : "Selesaikan Kuis"}
            </Button>
          </div>
        </div>
      )}

      {tab === "missions" && (
        <div className="space-y-4">
          <div className="clay-well space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground sm:text-base">
                Target Misi Hari Ini
              </p>
              <Badge variant={completedMissionCount === missions.length ? "mint" : "accent"}>
                {completedMissionCount}/{missions.length} Selesai
              </Badge>
            </div>
            <div
              role="progressbar"
              aria-valuenow={missionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres misi gizi hari ini"
              className="h-2.5 w-full overflow-hidden rounded-full bg-background/80"
            >
              <div
                className="h-full w-full origin-left rounded-full bg-primary transition-transform duration-200 motion-reduce:transition-none"
                style={{ transform: `scaleX(${missionPercent / 100})` }}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {completedMissionCount === missions.length
                ? "Hebat! Semua misi gizimu hari ini sudah selesai."
                : "Klik kartu misi di bawah setiap kali kamu menyelesaikannya hari ini."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {missions.map((mission) => {
              const checked = checkedMissions.includes(mission.id);
              return (
                <button
                  key={mission.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => handleToggleMission(mission.id)}
                  className={`clay-well flex min-h-11 cursor-pointer flex-col justify-between gap-3 p-4 text-left transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                    checked ? "border-primary/45 bg-mint-soft" : "hover:bg-card/70"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background text-primary shadow-xs">
                        <MissionIcon iconKey={mission.iconKey} />
                      </span>
                      {mission.badgeText}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        checked
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {checked && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                      {checked ? "Selesai" : "Belum"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-foreground">{mission.label}</p>
                    <p className="text-xs font-medium text-foreground/90">{mission.actionStep}</p>
                    <p className="text-xs text-muted-foreground">{mission.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground sm:text-sm">
              <Award className="h-4 w-4 text-primary" aria-hidden="true" />
              Lencana Pribadi (tanpa peringkat antar anak)
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`clay-well space-y-1 p-3 ${
                    badge.earned ? "bg-sun-soft/80" : "opacity-65"
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-xs font-bold text-foreground sm:text-sm">
                    <Trophy
                      className={`h-4 w-4 shrink-0 ${
                        badge.earned ? "text-primary" : "text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    />
                    {badge.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "cards" && (
        <div className="space-y-4">
          {progress.unlockedCards.length === 0 ? (
            <div className="clay-well p-6 text-center text-sm text-muted-foreground">
              Belum ada kartu koleksi pangan yang terbuka. Selesaikan kuis hari ini untuk membuka
              kartu pertamamu!
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {progress.unlockedCards.map((card) => (
                <div key={card.name} className="clay-well flex items-start gap-3 p-4">
                  <span className="clay-pill inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <CategoryIcon category={card.category} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-foreground">{card.name}</p>
                    <p className="text-xs text-muted-foreground">{card.fact}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
