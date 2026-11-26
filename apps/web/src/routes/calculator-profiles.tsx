import { ALLERGEN_LABELS, type ChildProfile } from "@mbg/shared";
import {
  ArrowLeft,
  Check,
  Download,
  Info,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEVEL_LABELS } from "@/features/admin/lib/labels";
import { ProfileWizard } from "@/features/calculator/components/profile-wizard";
import { getDefaultDisplayMode } from "@/features/public/lib/level-storage";
import { downloadProfilesBackup, useProfileStore } from "@/stores/profiles";

/** Local multi-child profile management, export & import page at `/kalkulator/profil`. */
export function CalculatorProfilesPage() {
  const [searchParams] = useSearchParams();
  const schoolSlug = searchParams.get("school")?.trim() || "";
  const backToCalculator = schoolSlug
    ? `/kalkulator?school=${encodeURIComponent(schoolSlug)}`
    : "/kalkulator";

  const profiles = useProfileStore((state) => state.profiles);
  const activeId = useProfileStore((state) => state.activeId);
  const storageUnavailable = useProfileStore((state) => state.storageUnavailable);
  const addProfile = useProfileStore((state) => state.addProfile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const removeProfile = useProfileStore((state) => state.removeProfile);
  const setActive = useProfileStore((state) => state.setActive);
  const exportProfilesJson = useProfileStore((state) => state.exportProfilesJson);
  const importProfilesJson = useProfileStore((state) => state.importProfilesJson);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null;
  const requiresParentGate =
    Boolean(activeProfile) && getDefaultDisplayMode(activeProfile!.level) === "anak";

  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = !requiresParentGate || parentUnlocked;

  const handleExport = () => {
    const json = exportProfilesJson();
    downloadProfilesBackup(json);
    setFeedback({ ok: true, text: "Cadangan profil (profil-gizi.json) berhasil diunduh." });
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = importProfilesJson(text);
    if (res.ok) {
      setFeedback({ ok: true, text: `Berhasil memulihkan ${res.count} profil dari file.` });
    } else {
      setFeedback({ ok: false, text: res.error });
    }
    event.target.value = "";
  };

  return (
    <div
      data-theme={activeProfile ? getDefaultDisplayMode(activeProfile.level) : "anak"}
      className="clay-sky-canvas relative min-h-screen overflow-hidden text-foreground"
    >
      <ClaySkyDecor />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="clay-card flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link
            to={backToCalculator}
            className="clay-pill inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-background px-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali</span>
          </Link>

          <BrandLogo size="sm" />
        </header>
      </div>

      <main className="relative z-10 mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {storageUnavailable && (
          <div
            role="status"
            className="clay-card flex items-start gap-2.5 bg-sun-soft/90 px-4 py-3 text-sm text-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Penyimpanan browser sedang dibatasi; gunakan Ekspor JSON agar data profil tidak hilang.
            </span>
          </div>
        )}

        <div className="clay-card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Kelola Profil Anak</h1>
            <p className="text-sm text-muted-foreground">
              Semua profil disimpan privat di perangkat ini dan tidak pernah dikirim ke server.
            </p>
          </div>

          {canManage && formMode === "closed" && (
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <Button
                type="button"
                variant="primary"
                className="col-span-2 w-full sm:col-span-1 sm:w-auto"
                onClick={() => {
                  setEditingProfile(null);
                  setFormMode("create");
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Profil
              </Button>
              {profiles.length > 0 && (
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={handleExport}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Ekspor JSON
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Impor JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="sr-only"
                aria-label="Pilih file cadangan profil JSON"
              />
            </div>
          )}
        </div>

        {feedback && (
          <div
            role="status"
            className={`clay-card px-4 py-3 text-sm font-medium ${
              feedback.ok
                ? "bg-mint-soft/80 text-foreground"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {!canManage ? (
          <Card className="mx-auto max-w-xl bg-gradient-to-b from-card to-sun-soft/45">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
                Halaman Khusus Orang Tua
              </CardTitle>
              <CardDescription>
                Untuk mengubah, menghapus, atau memindahkan cadangan profil anak SD, pastikan Anda
                adalah orang tua atau wali.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="primary"
                onClick={() => setParentUnlocked(true)}
              >
                Untuk orang tua: Lanjutkan kelola profil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {formMode !== "closed" && (
              <ProfileWizard
                initialProfile={editingProfile}
                onSave={(input) => {
                  if (formMode === "edit" && editingProfile) {
                    updateProfile(editingProfile.id, input);
                    setFeedback({ ok: true, text: `Profil ${input.nickname} diperbarui.` });
                  } else {
                    addProfile(input);
                    setFeedback({ ok: true, text: `Profil ${input.nickname} ditambahkan.` });
                  }
                  setFormMode("closed");
                  setEditingProfile(null);
                }}
                onCancel={() => {
                  setFormMode("closed");
                  setEditingProfile(null);
                }}
              />
            )}

            {profiles.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Belum ada profil tersimpan</CardTitle>
                  <CardDescription>
                    Tambahkan profil anak atau impor file cadangan `profil-gizi.json`.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {profiles.map((profile) => {
                  const isActive = profile.id === activeProfile?.id;
                  return (
                    <Card
                      key={profile.id}
                      className={isActive ? "ring-2 ring-primary/40" : undefined}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="truncate text-lg">{profile.nickname}</CardTitle>
                              {isActive && <Badge variant="mint">Aktif</Badge>}
                            </div>
                            <CardDescription>
                              {LEVEL_LABELS[profile.level]}, {profile.age} th, {profile.weightKg} kg
                            </CardDescription>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfile(profile);
                                setFormMode("edit");
                              }}
                              aria-label={`Ubah profil ${profile.nickname}`}
                              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground shadow-2xs hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirmDeleteId === profile.id) {
                                  removeProfile(profile.id);
                                  setConfirmDeleteId(null);
                                  setFeedback({
                                    ok: true,
                                    text: `Profil ${profile.nickname} dihapus dari perangkat.`,
                                  });
                                } else {
                                  setConfirmDeleteId(profile.id);
                                }
                              }}
                              aria-label={`Hapus profil ${profile.nickname}`}
                              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-destructive shadow-2xs hover:bg-coral-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 text-sm">
                        {profile.allergies.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Alergi:
                            </span>
                            {profile.allergies.map((a) => (
                              <Badge key={a} variant="accent">
                                {ALLERGEN_LABELS[a]}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {confirmDeleteId === profile.id && (
                          <div className="clay-well flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs">
                            <span className="font-semibold text-destructive">
                              Klik ikon hapus lagi untuk konfirmasi.
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Batal
                            </Button>
                          </div>
                        )}

                        {!isActive && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setActive(profile.id)}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Jadikan Profil Aktif
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
