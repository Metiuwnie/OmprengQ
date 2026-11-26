import { zodResolver } from "@hookform/resolvers/zod";
import { updateMenuSchema, type Level, type PortionItemFormInput, type UpdateMenuInput } from "@mbg/shared";
import { ArrowLeft, CheckCircle2, Copy, Send, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { buildMenuNameFromFoods, generateNutritionFunFact } from "../features/admin/lib/fun-fact";
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

  const savedTkpiFoods = useMemo(() => {
    const portionsList = detailQuery.data?.portions ?? [];
    return portionsList.flatMap((portion) =>
      portion.items.map((item) => ({
        name: item.foodName,
        category: item.foodCategory,
        energyKcal: item.foodEnergyKcal,
        proteinG: item.foodProteinG,
        fatG: item.foodFatG,
        carbG: item.foodCarbG,
        fiberG: item.foodFiberG,
        ironMg: item.foodIronMg,
      })),
    );
  }, [detailQuery.data?.portions]);

  const autoMenuName = useMemo(() => buildMenuNameFromFoods(savedTkpiFoods), [savedTkpiFoods]);
  const autoFunFact = useMemo(() => generateNutritionFunFact(savedTkpiFoods), [savedTkpiFoods]);

  if (detailQuery.isPending) {
    return (
      <div
        role="status"
        className="clay-card w-full px-4 py-12 text-center text-sm text-muted-foreground"
      >
        Memuat rincian menu…
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="w-full space-y-4">
        <Link
          to="/admin/menus"
          className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-card px-4 text-sm font-semibold text-foreground hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Daftar Menu
        </Link>
        <div
          role="alert"
          className="clay-card border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-destructive"
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
    await updateMutation.mutateAsync({
      date: values.date,
      description: values.description,
      name: autoMenuName || menu.name,
      funFact: autoFunFact || menu.funFact || null,
      photoUrl: null,
    });
    setActionFeedback("Info menu berhasil diperbarui.");
  };

  const handleSavePortion = async (level: Level, items: PortionItemFormInput[]) => {
    await savePortionMutation.mutateAsync({ level, items });
    const refreshed = await detailQuery.refetch();
    const updatedFoods = (refreshed.data?.portions ?? []).flatMap((portion) =>
      portion.items.map((item) => ({
        name: item.foodName,
        category: item.foodCategory,
        energyKcal: item.foodEnergyKcal,
        proteinG: item.foodProteinG,
        fatG: item.foodFatG,
        carbG: item.foodCarbG,
        fiberG: item.foodFiberG,
        ironMg: item.foodIronMg,
      })),
    );
    const nextName = buildMenuNameFromFoods(updatedFoods);
    const nextFunFact = generateNutritionFunFact(updatedFoods);
    if (nextName) {
      await updateMutation.mutateAsync({
        name: nextName,
        funFact: nextFunFact || null,
        photoUrl: null,
      });
    }
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
    <div className="w-full space-y-6">
      <div className="clay-card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/admin/menus"
            className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-card px-3.5 text-sm font-semibold text-foreground hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
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

        <div className="space-y-1 border-t border-border/70 pt-4">
          <p className="text-sm font-medium text-muted-foreground">{formatDateId(menu.date, true)}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{menu.name}</h1>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Menu</CardTitle>
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
                  <Label htmlFor="edit-name">Nama menu (otomatis dari bahan TKPI)</Label>
                  <Input
                    id="edit-name"
                    readOnly
                    value={autoMenuName || menu.name}
                    className="bg-background/70 text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-desc">Deskripsi</Label>
                  <Textarea id="edit-desc" {...register("description")} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Fakta seru edukasi gizi (otomatis dari bahan TKPI)</Label>
                  <div className="flex items-start gap-2 rounded-md border border-border/80 bg-mint-soft/50 px-3.5 py-2.5 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-foreground">
                      {autoFunFact ||
                        menu.funFact ||
                        "Tambahkan bahan TKPI pada porsi di bawah untuk menghasilkan fakta edukasi gizi secara otomatis."}
                    </span>
                  </div>
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
