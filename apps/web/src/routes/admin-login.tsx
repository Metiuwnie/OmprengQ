import { zodResolver } from "@hookform/resolvers/zod";
import { loginInputSchema, type LoginInput } from "@mbg/shared";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation } from "react-router-dom";
import { BrandLogo } from "@/components/brand-logo";
import { ClaySkyDecor } from "@/components/clay-sky-decor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthMe, useLogin } from "@/features/admin/hooks/use-auth";

/** Centered claymorphism admin sign-in route at `/admin/login`. */
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
    <div
      data-surface="admin"
      className="clay-sky-canvas relative flex min-h-screen flex-col overflow-hidden text-foreground"
    >
      <ClaySkyDecor />

      <header className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="clay-card flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <BrandLogo size="md" />
          </Link>

          <Link
            to="/"
            className="clay-pill inline-flex min-h-11 items-center gap-2 rounded-md bg-card px-4 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-sky-soft/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Beranda
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-12 pt-6 sm:px-6 sm:pt-10 lg:pt-12">
        <div className="w-full max-w-[460px]">
          <div className="relative z-10 -mb-3.5 flex items-end justify-center gap-6 sm:gap-8">
            <img
              src="/mascots/mascot-sayur.png"
              alt="Maskot sayur OmprengQ menyapa di atas kartu login"
              width={538}
              height={560}
              className="mascot-float h-28 w-auto object-contain sm:h-32"
            />
            <img
              src="/mascots/mascot-ayam-ompreng.png"
              alt="Maskot ayam membawa ompreng gizi di atas kartu login"
              width={511}
              height={560}
              className="mascot-float h-28 w-auto object-contain sm:h-32"
            />
          </div>

          <Card className="relative z-20 overflow-hidden shadow-[var(--shadow-clay-elevated)]">
            <CardHeader className="bg-gradient-to-b from-sky-soft/45 to-card pb-4 pt-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <span className="clay-pill inline-flex h-10 w-10 items-center justify-center rounded-md bg-mint-soft text-primary">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </span>
                Masuk Dashboard
              </CardTitle>
            </CardHeader>

            <CardContent>
              {loginMutation.isError && (
                <div
                  ref={errorBannerRef}
                  role="alert"
                  tabIndex={-1}
                  className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm text-foreground"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-destructive">Belum berhasil masuk</p>
                    <p className="mt-1 text-sm text-foreground">{loginMutation.error.message}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email admin</Label>
                  <Input
                    id="admin-email"
                    type="text"
                    autoComplete="username"
                    placeholder="suadmin / admin"
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
                  className="mt-2 w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Memeriksa akun…" : "Masuk"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
