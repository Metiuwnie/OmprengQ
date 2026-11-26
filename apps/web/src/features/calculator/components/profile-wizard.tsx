import {
  ACTIVITIES,
  ACTIVITY_LABELS,
  ALLERGEN_LABELS,
  ALLERGENS,
  ChildProfileInputSchema,
  LEVELS,
  SEXES,
  type ActivityLevel,
  type Allergen,
  type ChildProfile,
  type ChildProfileInput,
  type Level,
  type Sex,
} from "@mbg/shared";
import { ArrowLeft, ArrowRight, Check, Lock, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEVEL_LABELS } from "@/features/admin/lib/labels";
import { suggestLevelForAge } from "../lib/calculator-logic";

interface ProfileWizardProps {
  initialProfile?: ChildProfile | null;
  defaultLevel?: Level;
  onSave: (input: ChildProfileInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const STEP_TITLES = [
  { title: "Identitas & Jenjang", shortTitle: "Identitas" },
  { title: "Tubuh & Aktivitas", shortTitle: "Tubuh" },
  { title: "Alergi & Preferensi", shortTitle: "Alergi" },
] as const;

const SEX_LABELS: Readonly<Record<Sex, string>> = {
  male: "Laki-laki",
  female: "Perempuan",
};

/** 3-step local-only child profile wizard validated via shared Zod schema. */
export function ProfileWizard({
  initialProfile,
  defaultLevel = "sd_low",
  onSave,
  onCancel,
  submitLabel,
}: ProfileWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [age, setAge] = useState(String(initialProfile?.age ?? 9));
  const [sex, setSex] = useState<Sex>(initialProfile?.sex ?? "male");
  const [level, setLevel] = useState<Level>(initialProfile?.level ?? defaultLevel);
  const [levelTouched, setLevelTouched] = useState(Boolean(initialProfile));

  const [weightKg, setWeightKg] = useState(String(initialProfile?.weightKg ?? 28));
  const [heightCm, setHeightCm] = useState(String(initialProfile?.heightCm ?? 132));
  const [activity, setActivity] = useState<ActivityLevel>(initialProfile?.activity ?? "moderate");

  const [allergies, setAllergies] = useState<Allergen[]>(initialProfile?.allergies ?? []);
  const [dislikesText, setDislikesText] = useState(
    initialProfile?.dislikes.join(", ") ?? "",
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleAgeChange = (raw: string) => {
    setAge(raw);
    const parsedAge = Number(raw);
    if (!levelTouched && Number.isFinite(parsedAge) && parsedAge >= 4 && parsedAge <= 18) {
      setLevel(suggestLevelForAge(parsedAge));
    }
  };

  const toggleAllergen = (item: Allergen) => {
    setAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  const validateStepOne = (): boolean => {
    const parsedAge = Number(age);
    if (!nickname.trim()) {
      setErrorText("Nama panggilan wajib diisi.");
      return false;
    }
    if (!Number.isInteger(parsedAge) || parsedAge < 4 || parsedAge > 18) {
      setErrorText("Usia harus bilangan bulat antara 4 sampai 18 tahun.");
      return false;
    }
    return true;
  };

  const validateStepTwo = (): boolean => {
    const w = Number(weightKg);
    const h = Number(heightCm);
    if (!Number.isFinite(w) || w < 10 || w > 120) {
      setErrorText("Berat badan harus antara 10 sampai 120 kg.");
      return false;
    }
    if (!Number.isFinite(h) || h < 80 || h > 200) {
      setErrorText("Tinggi badan harus antara 80 sampai 200 cm.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setErrorText(null);
    if (step === 1 && validateStepOne()) {
      setStep(2);
    } else if (step === 2 && validateStepTwo()) {
      setStep(3);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorText(null);

    if (!validateStepOne() || !validateStepTwo()) return;

    const dislikes = dislikesText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 30);

    const parsed = ChildProfileInputSchema.safeParse({
      nickname: nickname.trim(),
      age: Number(age),
      sex,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      activity,
      allergies,
      dislikes,
      level,
    });

    if (!parsed.success) {
      setErrorText(parsed.error.issues[0]?.message ?? "Periksa kembali data profil.");
      return;
    }

    onSave(parsed.data);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 bg-gradient-to-r from-card via-sky-soft/40 to-mint-soft/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="mint">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Privat di Perangkat
          </Badge>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            Langkah {step} dari 3
          </span>
        </div>
        <CardTitle className="text-xl sm:text-2xl">
          {initialProfile ? `Ubah Profil: ${initialProfile.nickname}` : "Buat Profil Gizi"}
        </CardTitle>

        <ol aria-label="Tahapan pengisian profil" className="grid grid-cols-3 gap-2">
          {STEP_TITLES.map((item, idx) => {
            const stepNum = (idx + 1) as 1 | 2 | 3;
            const active = step === stepNum;
            const completed = step > stepNum;
            return (
              <li
                key={item.title}
                className={`rounded-md px-2 py-2 text-center text-xs font-semibold transition-colors sm:px-2.5 sm:text-left ${
                  active
                    ? "bg-sky text-sky-foreground shadow-[var(--shadow-clay-sky)]"
                    : completed
                      ? "bg-mint-soft text-mint-deep"
                      : "bg-sky-soft/70 text-muted-foreground"
                }`}
              >
                <span className="sm:hidden">
                  {stepNum}. {item.shortTitle}
                </span>
                <span className="hidden sm:block">
                  {stepNum}. {item.title}
                </span>
              </li>
            );
          })}
        </ol>
      </CardHeader>

      <CardContent className="pt-6">
        {errorText && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
          >
            {errorText}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="wizard-nickname">Nama panggilan anak / siswa</Label>
                <Input
                  id="wizard-nickname"
                  placeholder="Mis. Budi atau Kakak Sari"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wizard-age">Usia (4–18 tahun)</Label>
                <Input
                  id="wizard-age"
                  type="number"
                  min={4}
                  max={18}
                  step={1}
                  value={age}
                  onChange={(e) => handleAgeChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wizard-level">Jenjang sekolah</Label>
                <select
                  id="wizard-level"
                  value={level}
                  onChange={(e) => {
                    setLevelTouched(true);
                    setLevel(e.target.value as Level);
                  }}
                  className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {LEVEL_LABELS[lvl]}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium text-foreground">Jenis kelamin</legend>
                <div className="grid grid-cols-2 gap-2">
                  {SEXES.map((item) => {
                    const selected = sex === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSex(item)}
                        className={`min-h-11 cursor-pointer rounded-md border px-4 text-sm font-semibold transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                          selected
                            ? "border-transparent bg-accent text-accent-foreground shadow-[var(--shadow-clay-accent)]"
                            : "border-border bg-background text-foreground hover:bg-sky-soft/60"
                        }`}
                      >
                        {SEX_LABELS[item]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wizard-weight">Berat badan (kg)</Label>
                <Input
                  id="wizard-weight"
                  type="number"
                  min={10}
                  max={120}
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wizard-height">Tinggi badan (cm)</Label>
                <Input
                  id="wizard-height"
                  type="number"
                  min={80}
                  max={200}
                  step="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium text-foreground">Aktivitas harian</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {ACTIVITIES.map((item) => {
                    const selected = activity === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setActivity(item)}
                        className={`min-h-11 cursor-pointer rounded-md border px-3 py-2 text-sm font-semibold transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
                          selected
                            ? "border-transparent bg-accent text-accent-foreground shadow-[var(--shadow-clay-accent)]"
                            : "border-border bg-background text-foreground hover:bg-sky-soft/60"
                        }`}
                      >
                        {ACTIVITY_LABELS[item]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Alergi makanan (opsional)
                </legend>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((item) => {
                    const checked = allergies.includes(item);
                    return (
                      <label
                        key={item}
                        className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                          checked
                            ? "border-primary bg-mint-soft text-foreground"
                            : "border-border bg-background text-foreground hover:bg-sky-soft/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAllergen(item)}
                          className="h-4 w-4 accent-primary"
                        />
                        {ALLERGEN_LABELS[item]}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="wizard-dislikes">Makanan yang kurang disukai (opsional)</Label>
                <Input
                  id="wizard-dislikes"
                  placeholder="Pisahkan dengan koma, mis. pare, terong"
                  value={dislikesText}
                  onChange={(e) => setDislikesText(e.target.value)}
                />
              </div>

              <div className="clay-well flex items-start gap-2 p-4 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Profil disimpan di perangkat Anda saja. Anda bisa menambah anak lain atau mengekspor
                  cadangan kapan saja di menu Kelola Profil.
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            {(step > 1 || onCancel) && (
              <div className="flex flex-wrap gap-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      setErrorText(null);
                      setStep((prev) => (prev === 3 ? 2 : 1));
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Sebelumnya
                  </Button>
                )}
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 sm:flex-none"
                    onClick={onCancel}
                  >
                    Batal
                  </Button>
                )}
              </div>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                className="w-full sm:ml-auto sm:w-auto"
                onClick={handleNext}
              >
                Lanjut
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" className="w-full sm:ml-auto sm:w-auto">
                <Check className="h-4 w-4" aria-hidden="true" />
                {submitLabel ?? (initialProfile ? "Simpan Perubahan" : "Simpan & Hitung Gizi")}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
