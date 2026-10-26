import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";
import { navItems } from "./navItems";

// Navigates only to static workspace routes; resource search lands with Phase 04.
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const results = navItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setQuery(""); }}>
      <DialogTrigger className="shortcut-button" aria-label="Open command menu"><Command size={15} /><span>Go to</span><kbd>⌘ K</kbd></DialogTrigger>
      <DialogContent title="Go to page">
        <form onSubmit={(event) => { event.preventDefault(); if (results[0]) go(results[0].path); }}>
          <input className="command-input" aria-label="Filter pages" placeholder="Type a page name…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
        </form>
        {results.length ? (
          <ul className="command-results" aria-label="Pages">
            {results.map(({ path, label, icon: Icon }) => (
              <li key={path}><button type="button" className="command-result" onClick={() => go(path)}><Icon size={15} aria-hidden="true" />{label}</button></li>
            ))}
          </ul>
        ) : <p className="dialog-copy">No page matches “{query}”.</p>}
      </DialogContent>
    </Dialog>
  );
}
