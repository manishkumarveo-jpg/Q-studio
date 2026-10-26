import { Bell, ChevronDown, CircleHelp, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../../app/ThemeProvider";
import { CommandMenu } from "../navigation/CommandMenu";
import { NavList } from "../navigation/NavList";
import { navGroups } from "../navigation/navItems";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";

function Breadcrumbs() {
  // Match React Router's default case-insensitive, trailing-slash-tolerant routing.
  const path = useLocation().pathname.toLowerCase().replace(/\/+$/, "");
  const group = navGroups.find((g) => g.items.some((item) => item.path === path));
  const item = group?.items.find((i) => i.path === path);
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol>
        <li>Kepler Post</li>
        {group && <li>{group.label}</li>}
        <li aria-current="page">{item?.label ?? "Not found"}</li>
      </ol>
    </nav>
  );
}

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className={`app-shell${collapsed ? " app-shell--collapsed" : ""}`}>
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="sidebar-head">
          <Link className="brand" to="/dashboard" aria-label="QC Studio dashboard"><span>QC</span><strong>Studio</strong></Link>
          <button className="icon-button" type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>
        <NavList collapsed={collapsed} />
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <div className="topbar-start">
            <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DialogTrigger className="icon-button drawer-trigger" aria-label="Open navigation"><Menu size={18} /></DialogTrigger>
              <DialogContent title="Navigation" className="nav-drawer"><NavList onNavigate={() => setDrawerOpen(false)} /></DialogContent>
            </Dialog>
            <div className="workspace-control"><span className="workspace-mark">K</span><span>Kepler Post</span><ChevronDown size={15} /></div>
          </div>
          <div className="topbar-actions">
            <CommandMenu />
            <Button variant="secondary" size="sm" disabled title="Creating projects and uploads arrives in Phase 03"><Plus size={15} /> Create</Button>
            <Link className="icon-button" to="/activity" aria-label="Activity and notifications"><Bell size={17} /></Link>
            <Dialog>
              <DialogTrigger className="icon-button" aria-label="Help"><CircleHelp size={17} /></DialogTrigger>
              <DialogContent title="Help">
                <p className="dialog-copy">Press ⌘K (Ctrl+K) to jump to any page. Dashboard figures are Demo data from a local seed. Projects, uploads, sign-in and media review are not implemented yet; their pages say which phase delivers them.</p>
              </DialogContent>
            </Dialog>
            <button className="icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <div className="avatar" role="img" aria-label="Demo user (not signed in)">CM</div>
          </div>
        </header>
        <main className="page-content" id="main">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
