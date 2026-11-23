import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminPage } from "@/routes/admin";
import { AdminLoginPage } from "@/routes/admin-login";
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
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="/dev/design" element={<DevDesignPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
