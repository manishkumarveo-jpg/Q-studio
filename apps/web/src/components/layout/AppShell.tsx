import { Bell, ChevronDown, Command, Moon, Plus, Sun } from "lucide-react";
import { type ReactNode } from "react";
import { useTheme } from "../../app/ThemeProvider";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="app-shell">
      <aside className="foundation-rail" aria-label="QC Studio workspace">
        <a className="brand" href="/" aria-label="QC Studio home"><span>QC</span><strong>Studio</strong></a>
        <div className="rail-line" />
        <span className="rail-phase">01</span>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <div className="workspace-control"><span className="workspace-mark">K</span><span>Kepler Post</span><ChevronDown size={15} /></div>
          <div className="topbar-actions">
            <button className="shortcut-button" type="button" aria-label="Open command menu"><Command size={15} /><span>Search</span><kbd>⌘ K</kbd></button>
            <Button variant="secondary" size="sm"><Plus size={15} /> Create</Button>
            <button className="icon-button" type="button" aria-label="Notifications"><Bell size={17} /></button>
            <button className="icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={toggleTheme}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
            <div className="avatar" aria-label="Signed in demo user">CM</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
      <Dialog>
        <DialogTrigger className="feedback-tab">Foundation notes</DialogTrigger>
        <DialogContent title="Phase 1 UI foundation">
          <p className="dialog-copy">This local screen establishes shared visual and accessibility primitives. Dashboard, project data, authentication, uploads and media review are not implemented yet.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
