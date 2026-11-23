import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Placeholder route for the upcoming admin dashboard (M1-M2). */
export function AdminPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link to="/">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="mb-2">
              <Badge variant="primary">Rute Admin — Placeholder M0</Badge>
            </div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
              Dasbor Admin SPPG & Sekolah
            </CardTitle>
            <CardDescription>
              Halaman ini disiapkan sebagai placeholder rute /admin. Autentikasi admin dan pengelolaan
              menu harian akan dibangun pada milestone M1 dan M2.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Seluruh masukan admin nantinya divalidasi dengan skema Zod bersama dari{" "}
              <code className="font-mono text-xs">@mbg/shared</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
