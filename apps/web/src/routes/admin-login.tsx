import { zodResolver } from "@hookform/resolvers/zod";
import { loginInputSchema, type LoginInput } from "@mbg/shared";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthMe, useLogin } from "@/features/admin/hooks/use-auth";

/** Admin sign-in route at `/admin/login`. */
export function AdminLoginPage() {
  const authQuery = useAuthMe();
  const loginMutation = useLogin();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (loginMutation.isError) {
      errorBannerRef.current?.focus();
    }
  }, [loginMutation.isError]);

  if (authQuery.data) {
    const redirectTo =
      typeof (location.state as { from?: unknown } | null)?.from === "string"
        ? ((location.state as { from: string }).from || "/admin")
        : "/admin";
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = (values: LoginInput) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </div>

        <header className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-none text-foreground">OmprengQ</p>
            <p className="mt-1 text-sm text-muted-foreground">Portal Admin SPPG &amp; Sekolah</p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
              Masuk ke Dasbor Admin
            </CardTitle>
            <CardDescription>
              Kelola data sekolah, bahan pangan TKPI, dan menu gizi harian MBG. Guru, siswa, dan
              orang tua tidak memerlukan akun untuk melihat menu.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loginMutation.isError && (
              <div
                ref={errorBannerRef}
                role="alert"
                tabIndex={-1}
                className="mb-5 flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm text-foreground"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-destructive">Belum berhasil masuk</p>
                  <p className="mt-0.5 text-sm text-foreground">{loginMutation.error.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email admin</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@sekolah.sch.id"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "admin-email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="admin-email-error" className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Kata sandi</Label>
                <div className="relative flex items-center">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-12"
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "admin-password-error" : undefined}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPassword}
                    className="absolute right-0.5 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="admin-password-error" className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Memeriksa akun…" : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
