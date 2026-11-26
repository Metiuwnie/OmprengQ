import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/routes/home";

const AdminGuard = lazy(() =>
  import("@/features/admin/components/admin-guard").then((m) => ({ default: m.AdminGuard })),
);
const AdminLoginPage = lazy(() =>
  import("@/routes/admin-login").then((m) => ({ default: m.AdminLoginPage })),
);
const AdminPage = lazy(() => import("@/routes/admin").then((m) => ({ default: m.AdminPage })));
const AdminMenusPage = lazy(() =>
  import("@/routes/admin-menus").then((m) => ({ default: m.AdminMenusPage })),
);
const AdminMenuEditorPage = lazy(() =>
  import("@/routes/admin-menu-editor").then((m) => ({ default: m.AdminMenuEditorPage })),
);
const AdminSchoolsPage = lazy(() =>
  import("@/routes/admin-schools").then((m) => ({ default: m.AdminSchoolsPage })),
);
const AdminFoodsPage = lazy(() =>
  import("@/routes/admin-foods").then((m) => ({ default: m.AdminFoodsPage })),
);
const AdminSppgPage = lazy(() =>
  import("@/routes/admin-sppg").then((m) => ({ default: m.AdminSppgPage })),
);
const PublicTodayPage = lazy(() =>
  import("@/routes/public-today").then((m) => ({ default: m.PublicTodayPage })),
);
const PublicWeekPage = lazy(() =>
  import("@/routes/public-week").then((m) => ({ default: m.PublicWeekPage })),
);
const CalculatorPlaceholderPage = lazy(() =>
  import("@/routes/calculator-placeholder").then((m) => ({
    default: m.CalculatorPlaceholderPage,
  })),
);
const DevDesignPage = lazy(() =>
  import("@/routes/dev-design").then((m) => ({ default: m.DevDesignPage })),
);
const DevEnginePage = lazy(() =>
  import("@/routes/dev-engine").then((m) => ({ default: m.DevEnginePage })),
);

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground"
    >
      Memuat halaman…
    </div>
  );
}

/** Root application router with code-split public and admin bundles. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/s/:slug/hari-ini" element={<PublicTodayPage />} />
            <Route path="/s/:slug/minggu" element={<PublicWeekPage />} />
            <Route path="/kalkulator" element={<CalculatorPlaceholderPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminGuard />}>
              <Route index element={<AdminPage />} />
              <Route path="menus" element={<AdminMenusPage />} />
              <Route path="menus/:id" element={<AdminMenuEditorPage />} />
              <Route path="schools" element={<AdminSchoolsPage />} />
              <Route path="foods" element={<AdminFoodsPage />} />
              <Route path="sppg" element={<AdminSppgPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="/dev/design" element={<DevDesignPage />} />
            {import.meta.env.DEV && <Route path="/dev/engine" element={<DevEnginePage />} />}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
