import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminPage } from "@/routes/admin";
import { AdminFoodsPage } from "@/routes/admin-foods";
import { AdminLoginPage } from "@/routes/admin-login";
import { AdminMenuEditorPage } from "@/routes/admin-menu-editor";
import { AdminMenusPage } from "@/routes/admin-menus";
import { AdminSchoolsPage } from "@/routes/admin-schools";
import { AdminSppgPage } from "@/routes/admin-sppg";
import { DevDesignPage } from "@/routes/dev-design";
import { HomePage } from "@/routes/home";

const queryClient = new QueryClient();

/** Root application router and QueryClient provider. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
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
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
