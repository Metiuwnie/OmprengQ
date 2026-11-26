import type { Level, UsageEventType } from "@mbg/shared";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, Printer } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthMe } from "@/features/admin/hooks/use-auth";
import { useSppgList } from "@/features/admin/hooks/use-menus";
import { LEVEL_LABELS } from "@/features/admin/lib/labels";

interface ReportSummaryResponse {
  range: { from: string; to: string };
  schools: Array<{ id: string; name: string; slug: string }>;
  usageTotals: Record<UsageEventType, number>;
  dailyUsage: Array<{
    date: string;
    menu_view: number;
    share_wa: number;
    calculator_open: number;
    quiz_done: number;
  }>;
  nutritionByLevel: Array<{
    level: Level;
    menuCount: number;
    avgEnergyKcal: number;
    avgProteinG: number;
    avgFiberG: number;
    avgIronMg: number;
    target: { energyKcal: number; proteinG: number; fiberG: number; ironMg: number };
  }>;
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const past = new Date(now.getTime() - 13 * 86_400_000);
  return { from: past.toISOString().slice(0, 10), to };
}

function downloadReportCsv(data: ReportSummaryResponse) {
  const lines = [
    "Tanggal,Tayang Menu,Bagikan WA,Buka Kalkulator,Kuis Selesai",
    ...data.dailyUsage.map(
      (row) => `${row.date},${row.menu_view},${row.share_wa},${row.calculator_open},${row.quiz_done}`,
    ),
    "",
    "Jenjang,Jumlah Menu,Rata Energi (kkal),Target Energi (kkal),Rata Protein (g),Rata Serat (g),Rata Zat Besi (mg)",
    ...data.nutritionByLevel.map(
      (row) =>
        `${LEVEL_LABELS[row.level]},${row.menuCount},${row.avgEnergyKcal},${row.target.energyKcal},${row.avgProteinG},${row.avgFiberG},${row.avgIronMg}`,
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-omprengq-${data.range.from}-${data.range.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Admin aggregate usage & menu nutrition report page at `/admin/reports`. */
export function AdminReportsPage() {
  const authQuery = useAuthMe();
  const isSuperAdmin = authQuery.data?.role === "super_admin";
  const defaults = getDefaultDateRange();

  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [sppgId, setSppgId] = useState("");
  const [schoolId, setSchoolId] = useState("");

  const sppgQuery = useSppgList(isSuperAdmin);
  const sppgOptions = sppgQuery.data?.sppg ?? [];
  const activeSppgId = isSuperAdmin ? sppgId || sppgOptions[0]?.id || "" : "";

  const summaryQuery = useQuery({
    queryKey: ["admin", "reports", from, to, activeSppgId, schoolId],
    enabled: !isSuperAdmin || Boolean(activeSppgId),
    queryFn: async (): Promise<ReportSummaryResponse> => {
      const params = new URLSearchParams({ from, to });
      if (isSuperAdmin && activeSppgId) params.set("sppgId", activeSppgId);
      if (schoolId) params.set("schoolId", schoolId);
      const res = await fetch(`/api/admin/reports/summary?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memuat ringkasan laporan.");
      return (await res.json()) as ReportSummaryResponse;
    },
  });

  const data = summaryQuery.data;
  const maxDailyTotal = Math.max(
    1,
    ...(data?.dailyUsage ?? []).map(
      (d) => d.menu_view + d.share_wa + d.calculator_open + d.quiz_done,
    ),
  );

  return (
    <div className="w-full space-y-6">
      <div className="no-print clay-card space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Laporan Penggunaan &amp; Gizi
            </h1>
            <p className="text-sm text-muted-foreground">
              Data agregat anonim per hari (tanpa identitas atau profil siswa) dan rata-rata gizi
              menu terbit.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={!data}
              onClick={() => data && downloadReportCsv(data)}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Ekspor CSV
            </Button>
            <Button
              type="button"
              variant="sky"
              className="w-full sm:w-auto"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Cetak / PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="report-from">Dari tanggal</Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-to">Sampai tanggal</Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="report-sppg">SPPG</Label>
              <select
                id="report-sppg"
                value={activeSppgId}
                onChange={(e) => {
                  setSppgId(e.target.value);
                  setSchoolId("");
                }}
                className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
              >
                {sppgOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="report-school">Filter sekolah</Label>
            <select
              id="report-school"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 text-sm text-foreground shadow-[var(--shadow-clay-inset)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:border-primary/70 disabled:opacity-50"
            >
              <option value="">Semua sekolah</option>
              {(data?.schools ?? []).map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {summaryQuery.isPending && (
        <div role="status" className="clay-card p-8 text-center text-sm text-muted-foreground">
          Memuat laporan agregat…
        </div>
      )}

      {summaryQuery.isError && (
        <div
          role="alert"
          className="clay-card border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {summaryQuery.error.message}
        </div>
      )}

      {data && (
        <>
          <section aria-label="Ringkasan aktivitas anonim" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="clay-card bg-gradient-to-br from-card to-sky-soft p-4 sm:p-6">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Tayang Menu</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                {data.usageTotals.menu_view}
              </p>
            </div>
            <div className="clay-card bg-gradient-to-br from-card to-mint-soft p-4 sm:p-6">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Bagikan WA</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                {data.usageTotals.share_wa}
              </p>
            </div>
            <div className="clay-card bg-gradient-to-br from-card to-sun-soft p-4 sm:p-6">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                Buka Kalkulator
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                {data.usageTotals.calculator_open}
              </p>
            </div>
            <div className="clay-card bg-gradient-to-br from-card to-coral-soft p-4 sm:p-6">
              <p className="text-xs font-semibold text-muted-foreground sm:text-sm">Kuis Selesai</p>
              <p className="mt-2 font-display text-2xl font-bold text-foreground tabular-nums sm:text-3xl">
                {data.usageTotals.quiz_done}
              </p>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-sky" aria-hidden="true" />
                Grafik Aktivitas Harian Anonim
              </CardTitle>
              <CardDescription>
                Total interaksi harian (tayang menu, bagikan WA, kalkulator, dan kuis).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.dailyUsage.length === 0 ? (
                <p className="clay-well p-4 text-sm text-muted-foreground">
                  Belum ada aktivitas tercatat pada rentang tanggal ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.dailyUsage.map((row) => {
                    const total = row.menu_view + row.share_wa + row.calculator_open + row.quiz_done;
                    const widthPct = Math.round((total / maxDailyTotal) * 100);
                    return (
                      <div key={row.date} className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold sm:text-sm">
                          <span className="font-mono text-foreground tabular-nums">{row.date}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {total} total ({row.menu_view} menu, {row.share_wa} WA,{" "}
                            {row.calculator_open} kalkulator, {row.quiz_done} kuis)
                          </span>
                        </div>
                        <div className="clay-well h-3 w-full overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-sky"
                            style={{ width: `${Math.max(4, widthPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Rata-rata Gizi Menu Terbit vs Target Porsi MBG
              </CardTitle>
              <CardDescription>
                Dihitung dari menu terbit pada rentang tanggal terpilih (bukan data profil anak).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="border-b border-border bg-sky-soft/70 text-xs font-semibold text-foreground">
                    <tr>
                      <th className="px-3 py-3">Jenjang</th>
                      <th className="px-3 py-3 text-right">Menu Terbit</th>
                      <th className="px-3 py-3 text-right">Rata Energi</th>
                      <th className="px-3 py-3 text-right">Target MBG</th>
                      <th className="px-3 py-3 text-right">Rata Protein</th>
                      <th className="px-3 py-3 text-right">Rata Serat</th>
                      <th className="px-3 py-3 text-right">Rata Zat Besi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.nutritionByLevel.map((row) => (
                      <tr key={row.level}>
                        <td className="px-3 py-3 font-semibold text-foreground">
                          {LEVEL_LABELS[row.level]}
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          <Badge variant={row.menuCount > 0 ? "mint" : "default"}>
                            {row.menuCount}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {row.avgEnergyKcal} kkal
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                          {row.target.energyKcal} kkal
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {row.avgProteinG} g
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {row.avgFiberG} g
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {row.avgIronMg} mg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
