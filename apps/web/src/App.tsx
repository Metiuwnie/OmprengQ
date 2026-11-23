import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminPage } from "@/routes/admin";
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/dev/design" element={<DevDesignPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
