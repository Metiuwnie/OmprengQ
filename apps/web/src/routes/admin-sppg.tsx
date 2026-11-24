import type { AuthUser } from "@mbg/shared";
import { Building2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SppgListResponse } from "../features/admin/api/admin-api";
import {
  useCreateSppgMutation,
  useDeleteSppgMutation,
  useUpdateSppgMutation,
} from "../features/admin/hooks/use-admin-resources";
import { useSppgList } from "../features/admin/hooks/use-menus";

type SppgRow = SppgListResponse["sppg"][number];

/** SPPG management page at `/admin/sppg` (super_admin only). */
export function AdminSppgPage() {
  const { user } = useOutletContext<{ user: AuthUser }>();
  const sppgQuery = useSppgList(user.role === "super_admin");
  const createMutation = useCreateSppgMutation();
  const updateMutation = useUpdateSppgMutation();
  const deleteMutation = useDeleteSppgMutation();

  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  if (user.role !== "super_admin") {
    return <Navigate to="/admin" replace />;
  }

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setName("");
    setRegion("");
    setErrorText(null);
  };

  const openEdit = (row: SppgRow) => {
    setFormMode("edit");
    setEditingId(row.id);
    setName(row.name);
    setRegion(row.region ?? "");
    setErrorText(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorText(null);
    if (!name.trim()) {
      setErrorText("Nama SPPG wajib diisi.");
      return;
    }

    try {
      if (formMode === "create") {
        await createMutation.mutateAsync({ name: name.trim(), region: region.trim() || null });
      } else if (formMode === "edit" && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          input: { name: name.trim(), region: region.trim() || null },
        });
      }
      setFormMode("closed");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Gagal menyimpan data SPPG.");
    }
  };

  const rows = sppgQuery.data?.sppg ?? [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Kelola SPPG</h1>
          <p className="text-sm text-muted-foreground">
            Dapur Satuan Pelayanan Pemenuhan Gizi yang menaungi sekolah dan menu harian.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah SPPG
        </Button>
      </div>

      {formMode !== "closed" && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  {formMode === "create" ? "Tambah SPPG Baru" : "Ubah Data SPPG"}
                </CardTitle>
                <CardDescription>Isi nama dapur SPPG dan wilayah layanannya.</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setFormMode("closed")}
                aria-label="Tutup form SPPG"
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {errorText && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {errorText}
              </p>
            )}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sppg-name">Nama SPPG</Label>
                <Input
                  id="sppg-name"
                  placeholder="Mis. SPPG Semarang Tengah"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sppg-region">Wilayah (opsional)</Label>
                <Input
                  id="sppg-region"
                  placeholder="Mis. Jawa Tengah"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setFormMode("closed")}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan…" : "Simpan SPPG"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {deleteMutation.isError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {deleteMutation.error.message}
        </div>
      )}

      {sppgQuery.isPending && (
        <div
          role="status"
          className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Memuat daftar SPPG…
        </div>
      )}

      {sppgQuery.isSuccess && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{row.name}</span>
                    </CardTitle>
                    <CardDescription>{row.region ?? "Wilayah belum diisi"}</CardDescription>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      aria-label={`Ubah ${row.name}`}
                      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(row.id)}
                      disabled={deleteMutation.isPending}
                      aria-label={`Hapus ${row.name}`}
                      className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-destructive hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
