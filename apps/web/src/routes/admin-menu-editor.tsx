import { zodResolver } from "@hookform/resolvers/zod";
import { updateMenuSchema, type Level, type PortionItemFormInput, type UpdateMenuInput } from "@mbg/shared";
import { ArrowLeft, CheckCircle2, Copy, Send, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NutritionPanel, type NutritionPanelItem } from "../features/admin/components/nutrition-panel";
import { PortionEditor } from "../features/admin/components/portion-editor";
import {
  useCopyMenuMutation,
  useDeleteMenuMutation,
  useMenuDetailQuery,
  usePublishMenuMutation,
  useSavePortionMutation,
  useUpdateMenuMutation,
} from "../features/admin/hooks/use-menus";
import { formatDateId, LEVEL_LABELS, shiftIsoDate } from "../features/admin/lib/labels";

/** Menu editor page at `/admin/menus/:id` with live nutrition summary, publish & copy-to-date. */
export function AdminMenuEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detailQuery = useMenuDetailQuery(id);
  const updateMutation = useUpdateMenuMutation(id ?? "");
  const savePortionMutation = useSavePortionMutation(id ?? "");
  const publishMutation = usePublishMenuMutation(id ?? "");
  const copyMutation = useCopyMenuMutation();
  const deleteMutation = useDeleteMenuMutation();

  const [activeLevel, setActiveLevel] = useState<Level>("sd_low");
  const [liveItems, setLiveItems] = useState<NutritionPanelItem[]>([]);
  const [liveDirty, setLiveDirty] = useState(false);
  const [copyDate, setCopyDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty: isMetaDirty },
  } = useForm<UpdateMenuInput>({
    resolver: zodResolver(updateMenuSchema),
    values: detailQuery.data
      ? {
          date: detailQuery.data.menu.date,
          name: detailQuery.data.menu.name,
          description: detailQuery.data.menu.description ?? "",
          photoUrl: detailQuery.data.menu.photoUrl ?? "",
          funFact: detailQuery.data.menu.funFact ?? "",
        }
      : undefined,
  });

  const handleDraftChange = useCallback(
    (_level: Level, items: NutritionPanelItem[], isDirty: boolean) => {
      setLiveItems(items);
      setLiveDirty(isDirty);
    },
    [],
  );

  if (detailQuery.isPending) {
    return (
      <div
        role="status"
        className="mx-auto max-w-6xl rounded-lg border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground"
      >
        Memuat rincian menu…
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link
          to="/admin/menus"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Daftar Menu
        </Link>
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
        >
          {detailQuery.error?.message ?? "Menu tidak ditemukan."}
        </div>
      </div>
    );
  }

  const { menu, portions } = detailQuery.data;
  const totalSavedItems = portions.reduce((sum, p) => sum + p.items.length, 0);
  const effectiveCopyDate = copyDate || shiftIsoDate(menu.date, 7);

  const handleSaveMeta = async (values: UpdateMenuInput) => {
    setActionFeedback(null);
    await updateMutation.mutateAsync(values);
    setActionFeedback("Info menu berhasil diperbarui.");
  };

  const handleSavePortion = async (level: Level, items: PortionItemFormInput[]) => {
    await savePortionMutation.mutateAsync({ level, items });
  };

  const handlePublish = async () => {
    setActionFeedback(null);
    await publishMutation.mutateAsync();
    setActionFeedback("Menu resmi dipublikasikan.");
  };

  const handleCopy = async () => {
    if (!effectiveCopyDate) return;
    setActionFeedback(null);
    const copied = await copyMutation.mutateAsync({ menuId: menu.id, targetDate: effectiveCopyDate });
    navigate(`/admin/menus/${copied.menu.id}`);
  };

  const handleDelete = async () => {
    if (menu.status === "published" && !confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteMutation.mutateAsync({ id: menu.id, confirm: menu.status === "published" });
    navigate("/admin/menus", { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/menus"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Kalender Menu
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={menu.status === "published" ? "mint" : "accent"}>
            {menu.status === "published" ? "Terbit" : "Draf"}
          </Badge>
          {menu.status === "draft" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={publishMutation.isPending || totalSavedItems === 0}
              onClick={handlePublish}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {publishMutation.isPending ? "Mempublikasikan…" : "Publikasikan"}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            {confirmDelete ? "Klik lagi untuk Hapus" : "Hapus"}
          </Button>
          {confirmDelete && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Batal
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{formatDateId(menu.date, true)}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{menu.name}</h1>
      </div>

      {actionFeedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-[var(--color-success)]/40 bg-mint/30 px-4 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {(publishMutation.isError || copyMutation.isError || deleteMutation.isError || updateMutation.isError) && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {publishMutation.error?.message ||
            copyMutation.error?.message ||
            deleteMutation.error?.message ||
            updateMutation.error?.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Menu</CardTitle>
              <CardDescription>
                Nama, deskripsi, dan edukasi mikro yang tampil kepada guru, siswa, dan orang tua.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleSaveMeta)} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-date">Tanggal penyajian</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    aria-invalid={errors.date ? "true" : "false"}
                    {...register("date")}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Nama menu</Label>
                  <Input
                    id="edit-name"
                    aria-invalid={errors.name ? "true" : "false"}
                    {...register("name")}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-desc">Deskripsi</Label>
                  <Textarea id="edit-desc" {...register("description")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-funfact">Fakta seru edukasi gizi</Label>
                  <Input id="edit-funfact" {...register("funFact")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-photo">Tautan foto menu (opsional)</Label>
                  <Input
                    id="edit-photo"
                    type="url"
                    aria-invalid={errors.photoUrl ? "true" : "false"}
                    {...register("photoUrl")}
                  />
                  {errors.photoUrl && (
                    <p className="text-sm text-destructive">{errors.photoUrl.message}</p>
                  )}
                </div>

                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!isMetaDirty || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Menyimpan…" : "Simpan Info Menu"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <PortionEditor
            key={`${menu.id}-${detailQuery.dataUpdatedAt}`}
            portions={portions}
            activeLevel={activeLevel}
            onActiveLevelChange={setActiveLevel}
            onDraftChange={handleDraftChange}
            onSave={handleSavePortion}
            isSaving={savePortionMutation.isPending}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salin Menu ke Tanggal Lain</CardTitle>
              <CardDescription>
                Duplikasi seluruh komposisi bahan per jenjang ke tanggal target sebagai draf baru.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="copy-target-date">Tanggal tujuan</Label>
                <Input
                  id="copy-target-date"
                  type="date"
                  value={effectiveCopyDate}
                  onChange={(event) => setCopyDate(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!effectiveCopyDate || copyMutation.isPending}
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copyMutation.isPending ? "Menyalin…" : "Salin Menu"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside aria-label="Panel gizi langsung">
          <NutritionPanel
            levelLabel={LEVEL_LABELS[activeLevel]}
            items={liveItems}
            isDirty={liveDirty}
          />
        </aside>
      </div>
    </div>
  );
}
