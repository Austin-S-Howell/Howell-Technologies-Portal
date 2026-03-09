import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./layouts/AppShell";
import { ApplicationStatusPage } from "./pages/ApplicationStatusPage";
import { ClientDetailPage } from "./pages/ClientDetailPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/status" element={<ApplicationStatusPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
