import type { ReactElement } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../components/dashboard/DashboardPage";
import { AppShell } from "../components/layout/AppShell";
import { navItems, type NavItem } from "../components/navigation/navItems";
import { AllAssetsPage, CollectionPage, CollectionsPage, FavoritesPage, RecentPage } from "../components/assets/AssetSearch";
import { ArchivePage, ProjectBrowser, ProjectsPage } from "../components/projects/ProjectPages";
import { LoginPage, RequireAuth } from "../components/auth/AuthScreens";
import { SettingsPage } from "../components/settings/SettingsPage";
import { StatusState } from "../components/ui/StatusState";
import { AuthProvider } from "../features/auth/AuthProvider";
import { LibraryProvider } from "../features/projects/LibraryProvider";
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

const pages: Record<string, ReactElement> = {
  "/dashboard": <DashboardPage />,
  "/projects": <ProjectsPage />,
  "/assets": <AllAssetsPage />,
  "/archive": <ArchivePage />,
  "/recent": <RecentPage />,
  "/favorites": <FavoritesPage />,
  "/collections": <CollectionsPage />,
  "/settings": <SettingsPage />,
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <LibraryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {navItems.map((item) => (
              <Route key={item.path} path={item.path} element={pages[item.path] ?? <RoutePlaceholder item={item} />} />
            ))}
            <Route path="projects/:projectId" element={<ProjectBrowser />} />
            <Route path="projects/:projectId/folders/:folderId" element={<ProjectBrowser />} />
            <Route path="collections/:collectionId" element={<CollectionPage />} />
            <Route path="*" element={<RouteFallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
