import { Bell, ChevronDown, CircleHelp, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../../app/ThemeProvider";
import { roleLabels } from "../../../../../packages/contracts/roles";
import { useAuth, useSession } from "../../features/auth/AuthProvider";
import { CommandMenu } from "../navigation/CommandMenu";
import { NavList } from "../navigation/NavList";
import { navGroups } from "../navigation/navItems";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";

function Breadcrumbs({ workspace }: { workspace: string }) {
  // Match React Router's default case-insensitive, trailing-slash-tolerant routing.
  const path = useLocation().pathname.toLowerCase().replace(/\/+$/, "");
  const matches = (itemPath: string) => path === itemPath || path.startsWith(`${itemPath}/`);
  const group = navGroups.find((g) => g.items.some((item) => matches(item.path)));
  const item = group?.items.find((i) => matches(i.path));
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol>
        <li>{workspace}</li>
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
  const { user, workspace } = useSession();
  const { signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const initials = user.displayName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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
            <div className="workspace-control"><span className="workspace-mark">{workspace.name.slice(0, 1).toUpperCase()}</span><span>{workspace.name}</span><ChevronDown size={15} /></div>
          </div>
          <div className="topbar-actions">
            <CommandMenu />
            <Button variant="secondary" size="sm" disabled title="Uploads arrive in Phase 07"><Plus size={15} /> Create</Button>
            <Link className="icon-button" to="/activity" aria-label="Activity and notifications"><Bell size={17} /></Link>
            <Dialog>
              <DialogTrigger className="icon-button" aria-label="Help"><CircleHelp size={17} /></DialogTrigger>
              <DialogContent title="Help">
                <p className="dialog-copy">Press ⌘K (Ctrl+K) to jump to any page. Dashboard figures and the project library are Demo data from a local seed; renames, moves and archives stay in this browser tab. Your sign-in, members and roles are real and checked by the server. Uploads and media review are not implemented yet; their pages say which phase delivers them.</p>
              </DialogContent>
            </Dialog>
            <button className="icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <div className="avatar" role="img" aria-label={`Signed in as ${user.displayName} (${roleLabels[user.role]})`}>{initials}</div>
            <button className="icon-button" type="button" aria-label="Sign out" onClick={async () => setSignOutError(await signOut())}><LogOut size={17} /></button>
          </div>
        </header>
        <main className="page-content" id="main">
          {signOutError && <p className="field-error" role="alert">Sign out failed: {signOutError}</p>}
          <Breadcrumbs workspace={workspace.name} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
