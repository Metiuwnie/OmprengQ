import {
  LEVELS,
  SCHOOL_TIMEZONES,
  slugifySchoolName,
  SLUG_REGEX,
  type AuthUser,
  type Level,
  type SchoolTimezone,
} from "@mbg/shared";
import { Download, Pencil, Plus, Printer, QrCode, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadSchoolQr, getSchoolQrUrl, type SchoolListResponse } from "../features/admin/api/admin-api";
import {
  useCreateSchoolMutation,
  useDeleteSchoolMutation,
  useSchoolsQuery,
  useUpdateSchoolMutation,
} from "../features/admin/hooks/use-admin-resources";
import { useSppgList } from "../features/admin/hooks/use-menus";
import { LEVEL_SHORT_LABELS } from "../features/admin/lib/labels";

type SchoolRow = SchoolListResponse["schools"][number];

const TIMEZONE_LABELS: Record<SchoolTimezone, string> = {
  "Asia/Jakarta": "WIB (Asia/Jakarta)",
  "Asia/Makassar": "WITA (Asia/Makassar)",
  "Asia/Jayapura": "WIT (Asia/Jayapura)",
};

const QR_FRAME_SRC = "/mascots/mascot-ayam-qr-frame.jpg";
// Inner white box coordinates inside the 1024x1024 mascot frame with comfortable quiet-zone padding.
const QR_BOX_PCT = { left: 9.5, top: 36, width: 61, height: 55.5 } as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar QR."));
    img.src = src;
  });
}

async function downloadFramedQrPng(schoolId: string, slug: string): Promise<void> {
  const [frameImg, qrImg] = await Promise.all([
    loadImage(QR_FRAME_SRC),
    loadImage(getSchoolQrUrl(schoolId, "png", 640)),
  ]);

  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung di browser ini.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(frameImg, 0, 0, size, size);

  const boxLeft = (QR_BOX_PCT.left / 100) * size;
  const boxTop = (QR_BOX_PCT.top / 100) * size;
  const boxWidth = (QR_BOX_PCT.width / 100) * size;
  const boxHeight = (QR_BOX_PCT.height / 100) * size;
  const qrSide = Math.min(boxWidth, boxHeight);
  const qrX = boxLeft + (boxWidth - qrSide) / 2;
  const qrY = boxTop + (boxHeight - qrSide) / 2;

  ctx.drawImage(qrImg, qrX, qrY, qrSide, qrSide);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Gagal membuat file PNG.");

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `qr-${slug}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Schools management and printable QR poster page at `/admin/schools`. */
export function AdminSchoolsPage() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const isSuperAdmin = user.role === "super_admin";
  const canManage = user.role === "super_admin" || user.role === "sppg_admin";

  const [selectedSppgId, setSelectedSppgId] = useState<string>(user.sppgId ?? "");
  const sppgQuery = useSppgList(isSuperAdmin);
  const sppgOptions = sppgQuery.data?.sppg;
  const activeSppgId = isSuperAdmin ? selectedSppgId || sppgOptions?.[0]?.id || "" : (user.sppgId ?? "");

  const schoolsQuery = useSchoolsQuery(
    isSuperAdmin ? activeSppgId || undefined : undefined,
    !isSuperAdmin || Boolean(activeSppgId),
  );
  const createMutation = useCreateSchoolMutation();
  const updateMutation = useUpdateSchoolMutation();
  const deleteMutation = useDeleteSchoolMutation();

  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [levels, setLevels] = useState<Level[]>(["sd_low", "sd_high"]);
  const [timezone, setTimezone] = useState<SchoolTimezone>("Asia/Jakarta");
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [qrSchool, setQrSchool] = useState<SchoolRow | null>(null);
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setLevels(["sd_low", "sd_high"]);
    setTimezone("Asia/Jakarta");
    setActive(true);
    setFormError(null);
  };

  const openEdit = (school: SchoolRow) => {
    setFormMode("edit");
    setEditingId(school.id);
    setName(school.name);
    setSlug(school.slug);
    setSlugTouched(true);
    setLevels(school.levels);
    setTimezone((school.timezone as SchoolTimezone) || "Asia/Jakarta");
    setActive(school.active);
    setFormError(null);
  };

  const toggleLevel = (lvl: Level) => {
    setLevels((prev) => (prev.includes(lvl) ? prev.filter((item) => item !== lvl) : [...prev, lvl]));
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifySchoolName(value));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();

    if (!trimmedName) {
      setFormError("Nama sekolah wajib diisi.");
      return;
    }
    if (trimmedSlug && !SLUG_REGEX.test(trimmedSlug)) {
      setFormError("Slug hanya boleh huruf kecil, angka, dan tanda strip.");
      return;
    }
    if (levels.length === 0) {
      setFormError("Pilih minimal satu jenjang pendidikan.");
      return;
    }

    try {
      if (formMode === "create") {
        const res = await createMutation.mutateAsync({
          sppgId: isSuperAdmin ? activeSppgId : undefined,
          name: trimmedName,
          slug: trimmedSlug || undefined,
          levels,
          timezone,
          active,
        });
        setQrSchool(res.school);
      } else if (formMode === "edit" && editingId) {
        const res = await updateMutation.mutateAsync({
          id: editingId,
          input: {
            name: trimmedName,
            slug: trimmedSlug || undefined,
            levels,
            timezone,
            active,
          },
        });
        if (qrSchool?.id === res.school.id) setQrSchool(res.school);
      }
      setFormMode("closed");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan sekolah.");
    }
  };

  const handleDownload = async (format: "png" | "svg") => {
    if (!qrSchool) return;
    setQrFeedback(null);
    try {
      if (format === "png") {
        await downloadFramedQrPng(qrSchool.id, qrSchool.slug);
      } else {
        await downloadSchoolQr(qrSchool.id, qrSchool.slug, format);
      }
    } catch (error) {
      setQrFeedback(error instanceof Error ? error.message : "Gagal mengunduh QR.");
    }
  };

  const schoolRows = schoolsQuery.data?.schools ?? [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full space-y-6">
      <div className="no-print clay-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sekolah &amp; QR Cetak</h1>
          {canManage && (
            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={isSuperAdmin && !activeSppgId}
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Sekolah
            </Button>
          )}
        </div>

        {isSuperAdmin && (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border/70 pt-4">
            <div className="w-full max-w-sm space-y-1.5">
              <Label htmlFor="schools-sppg-filter">SPPG</Label>
              <select
                id="schools-sppg-filter"
                value={activeSppgId}
                onChange={(event) => {
                  setSelectedSppgId(event.target.value);
                  setFormMode("closed");
                  setQrSchool(null);
                }}
                className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
              >
                {(sppgOptions ?? []).length === 0 && <option value="">Memuat SPPG…</option>}
                {(sppgOptions ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {schoolsQuery.isSuccess && (
              <Badge variant="mint" className="tabular-nums">
                {schoolRows.length} sekolah
              </Badge>
            )}
          </div>
        )}
      </div>

      {formMode !== "closed" && (
        <Card className="no-print">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  {formMode === "create" ? "Tambah Sekolah Baru" : "Ubah Data Sekolah"}
                </CardTitle>
                <CardDescription>
                  Slug menjadi bagian alamat tautan QR permanen (<code className="font-mono text-xs">/s/slug/hari-ini</code>).
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setFormMode("closed")}
                aria-label="Tutup form sekolah"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {formError && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="school-name">Nama sekolah</Label>
                <Input
                  id="school-name"
                  placeholder="Mis. SDN 01 Semarang"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-slug">Slug tautan</Label>
                <Input
                  id="school-slug"
                  placeholder="sdn-01-semarang"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(event.target.value);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-tz">Zona waktu</Label>
                <select
                  id="school-tz"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value as SchoolTimezone)}
                  className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-card px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
                >
                  {SCHOOL_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {TIMEZONE_LABELS[tz]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Sekolah aktif
                </label>
              </div>

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium text-foreground">Jenjang yang tersedia</legend>
                <div className="flex flex-wrap gap-3">
                  {LEVELS.map((lvl) => (
                    <label
                      key={lvl}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={levels.includes(lvl)}
                        onChange={() => toggleLevel(lvl)}
                        className="h-4 w-4 accent-primary"
                      />
                      {LEVEL_SHORT_LABELS[lvl]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setFormMode("closed")}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan…" : "Simpan Sekolah"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {qrSchool && (
        <Card className="qr-print-sheet">
          <CardHeader className="no-print">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
                  Kartu QR Cetak: {qrSchool.name}
                </CardTitle>
                <CardDescription>
                  Tautan tujuan: <code className="font-mono text-xs">/s/{qrSchool.slug}/hari-ini</code>
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setQrSchool(null)}
                aria-label="Tutup kartu QR"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="relative aspect-square w-full max-w-[360px] select-none overflow-hidden rounded-2xl bg-white">
              <img
                src={QR_FRAME_SRC}
                alt="Bingkai maskot OmprengQ untuk kode QR"
                width={1024}
                height={1024}
                className="h-full w-full object-contain"
              />
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: `${QR_BOX_PCT.left}%`,
                  top: `${QR_BOX_PCT.top}%`,
                  width: `${QR_BOX_PCT.width}%`,
                  height: `${QR_BOX_PCT.height}%`,
                }}
              >
                <img
                  src={getSchoolQrUrl(qrSchool.id, "svg", 512)}
                  alt={`Kode QR menu harian ${qrSchool.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-display text-2xl font-bold text-foreground">{qrSchool.name}</p>
              <p className="text-base font-medium text-foreground">
                Pindai untuk menu &amp; gizi hari ini
              </p>
              <p className="text-xs text-muted-foreground">/s/{qrSchool.slug}/hari-ini</p>
            </div>

            {qrFeedback && <p className="no-print text-sm text-destructive">{qrFeedback}</p>}

            <div className="no-print flex flex-wrap justify-center gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => handleDownload("png")}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh PNG
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleDownload("svg")}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh SVG
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                Cetak Poster
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="no-print">
        {schoolsQuery.isPending && (
          <div
            role="status"
            className="clay-card px-4 py-10 text-center text-sm text-muted-foreground"
          >
            Memuat daftar sekolah…
          </div>
        )}

        {schoolsQuery.isError && (
          <div
            role="alert"
            className="clay-card border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
          >
            {schoolsQuery.error.message}
          </div>
        )}

        {schoolsQuery.isSuccess && schoolRows.length === 0 && (
          <div className="clay-card border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Belum ada sekolah terdaftar pada SPPG ini.
          </div>
        )}

        {schoolsQuery.isSuccess && schoolRows.length > 0 && (
          <>
            <div className="clay-card hidden overflow-x-auto overflow-hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-border bg-sky-soft/70 text-xs font-semibold text-foreground/80">
                  <tr>
                    <th className="px-4 py-3">Sekolah</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Jenjang</th>
                    <th className="px-4 py-3">Zona waktu</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schoolRows.map((school) => (
                    <tr key={school.id} className="transition-colors hover:bg-sky-soft/25">
                      <td className="px-4 py-3 font-semibold text-foreground">{school.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {school.slug}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {school.levels.map((lvl) => (
                            <Badge key={lvl} variant="default">
                              {LEVEL_SHORT_LABELS[lvl]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{school.timezone}</td>
                      <td className="px-4 py-3">
                        <Badge variant={school.active ? "mint" : "default"}>
                          {school.active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setQrSchool(school)}
                          >
                            <QrCode className="h-4 w-4" aria-hidden="true" />
                            QR
                          </Button>
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(school)}
                                aria-label={`Ubah ${school.name}`}
                                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground shadow-2xs hover:bg-sky-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(school.id)}
                                disabled={deleteMutation.isPending}
                                aria-label={`Hapus ${school.name}`}
                                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-destructive shadow-2xs hover:bg-coral-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {schoolRows.map((school) => (
                <div
                  key={school.id}
                  className="clay-card space-y-3 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{school.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        /s/{school.slug}/hari-ini
                      </p>
                    </div>
                    <Badge variant={school.active ? "mint" : "default"}>
                      {school.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {school.levels.map((lvl) => (
                      <Badge key={lvl} variant="default">
                        {LEVEL_SHORT_LABELS[lvl]}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setQrSchool(school)}
                    >
                      <QrCode className="h-4 w-4" aria-hidden="true" />
                      Kartu QR
                    </Button>
                    {canManage && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(school)}
                      >
                        Ubah
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
