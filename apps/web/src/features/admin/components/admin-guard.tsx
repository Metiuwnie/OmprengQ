import { Navigate, useLocation } from "react-router-dom";
import { useAuthMe } from "../hooks/use-auth";
import { AdminLayout } from "./admin-layout";

/** Protect `/admin/*` routes by verifying active session cookie via `GET /api/auth/me`. */
export function AdminGuard() {
  const authQuery = useAuthMe();
  const location = useLocation();

  if (authQuery.isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground"
      >
        Memeriksa sesi admin…
      </div>
    );
  }

  if (authQuery.isError || !authQuery.data) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <AdminLayout user={authQuery.data} />;
}
