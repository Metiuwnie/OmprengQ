import { ArrowLeft, Calculator } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Placeholder route for `/kalkulator` until M5 is implemented. */
export function CalculatorPlaceholderPage() {
  const [params] = useSearchParams();
  const schoolSlug = params.get("school");

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          to={schoolSlug ? `/s/${encodeURIComponent(schoolSlug)}/hari-ini` : "/"}
          className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-card px-4 text-sm font-semibold text-foreground hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </Link>

        <Card className="overflow-hidden bg-gradient-to-b from-card to-mint-soft/60">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="accent">Segera hadir</Badge>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Calculator className="h-6 w-6 text-primary" aria-hidden="true" />
                  Kalkulator Gizi Harian
                </CardTitle>
              </div>
              <img
                src="/mascots/mascot-sayur-tanya.png"
                alt="Maskot sayur bertanya OmprengQ"
                width={538}
                height={560}
                className="mascot-float h-24 w-auto object-contain"
              />
            </div>
            <CardDescription className="pt-2 text-base">
              Perhitungan sisa kebutuhan gizi dan saran menu rumah berjalan lokal di perangkat Anda
              tanpa mengirim data ke server.
            </CardDescription>
          </CardHeader>
          {schoolSlug && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Sekolah terpilih: <span className="font-mono text-foreground">{schoolSlug}</span>
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
