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
      <div className="mx-auto max-w-xl space-y-5">
        <Link
          to={schoolSlug ? `/s/${encodeURIComponent(schoolSlug)}/hari-ini` : "/"}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </Link>

        <Card>
          <CardHeader>
            <div className="mb-1">
              <Badge variant="accent">Segera hadir di M5</Badge>
            </div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-primary" aria-hidden="true" />
              Kalkulator Sisa Kebutuhan Gizi
            </CardTitle>
            <CardDescription className="text-base">
              Kalkulator gizi pribadi dan rekomendasi makanan rumah akan dibangun pada milestone M4
              dan M5. Data profil anak tersimpan lokal di perangkat tanpa dikirim ke server.
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
