import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "../../features/projects/LibraryProvider";
import { emptyQuery, searchAssets } from "../../features/search/catalog";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";
import { navItems } from "./navItems";

const ASSET_RESULTS = 5;

// Pages plus visible (non-archived) demo assets. Phase 06 replaces the local index with a scoped API query.
export function CommandMenu() {
  const { library } = useLibrary();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const results = navItems.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const search = query.trim() ? searchAssets(library, { ...emptyQuery, text: query }) : null;
  const assets = search?.ok ? search.assets.slice(0, ASSET_RESULTS) : [];
  const assetsUrl = (id?: string) => `/assets?${new URLSearchParams({ q: query.trim(), ...(id && { asset: id }) })}`;

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
        <form onSubmit={(event) => { event.preventDefault(); if (results[0]) go(results[0].path); else if (assets[0]) go(assetsUrl(assets[0].id)); }}>
          <input className="command-input" aria-label="Filter pages" placeholder="Type a page or asset name…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
        </form>
        {results.length > 0 && (
          <ul className="command-results" aria-label="Pages">
            {results.map(({ path, label, icon: Icon }) => (
              <li key={path}><button type="button" className="command-result" onClick={() => go(path)}><Icon size={15} aria-hidden="true" />{label}</button></li>
            ))}
          </ul>
        )}
        {assets.length > 0 && (
          <ul className="command-results" aria-label="Assets (Demo data)">
            {assets.map((a) => <li key={a.id}><button type="button" className="command-result" onClick={() => go(assetsUrl(a.id))}>{a.name}</button></li>)}
            <li><button type="button" className="command-result" onClick={() => go(assetsUrl())}>Search all assets for “{query.trim()}”</button></li>
          </ul>
        )}
        {!results.length && !assets.length && <p className="dialog-copy">No page or asset matches “{query}”.</p>}
      </DialogContent>
    </Dialog>
  );
}
