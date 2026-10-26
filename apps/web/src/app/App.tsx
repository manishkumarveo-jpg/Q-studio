import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../components/dashboard/DashboardPage";
import { AppShell } from "../components/layout/AppShell";
import { navItems, type NavItem } from "../components/navigation/navItems";
import { StatusState } from "../components/ui/StatusState";
import { ThemeProvider } from "./ThemeProvider";

function RoutePlaceholder({ item }: { item: NavItem }) {
  return (
    <>
      <h1 className="page-title">{item.label}</h1>
      <p className="page-intro">{item.summary}</p>
      <StatusState state="info" title={`Arrives in Phase ${item.phase}`}>This page is a navigation destination only. No data is loaded and no action is available here yet.</StatusState>
    </>
  );
}

function RouteFallback() {
  return (
    <>
      <StatusState state="empty" title="This route is not available">The requested page does not exist or has not been implemented.</StatusState>
      <Link className="button button--primary back-home" to="/dashboard">Return to dashboard</Link>
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            {navItems.filter((item) => item.path !== "/dashboard").map((item) => (
              <Route key={item.path} path={item.path} element={<RoutePlaceholder item={item} />} />
            ))}
            <Route path="*" element={<RouteFallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
