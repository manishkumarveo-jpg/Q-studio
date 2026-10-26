import { type FormEvent, type ReactNode, useId, useState } from "react";
import { folderPath, isFolderHidden, move, rename, setArchived, type EntityKind } from "../../features/projects/library";
import { useLibrary } from "../../features/projects/LibraryProvider";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/Dialog";

export const LOCAL = "in this browser tab (Demo data)";

export function FormDialog({ trigger, title, error, onOpen, onSubmit, children }: {
  trigger: string; title: string; error: string | null; onOpen: () => void; onSubmit: () => boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (onSubmit()) setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (next) onOpen(); setOpen(next); }}>
      <DialogTrigger asChild><Button variant="secondary" size="sm">{trigger}</Button></DialogTrigger>
      <DialogContent title={title}>
        <form className="dialog-form" onSubmit={submit} noValidate>
          {children}
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="dialog-actions"><Button type="submit">Save</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RenameAction({ kind, id, name }: { kind: EntityKind; id: string; name: string }) {
  const { apply, setNotice } = useLibrary();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  return (
    <FormDialog
      trigger={`Rename ${kind}`} title={`Rename ${kind}`} error={error}
      onOpen={() => { setValue(name); setError(null); }}
      onSubmit={() => {
        const failure = apply((library) => rename(library, kind, id, value));
        setError(failure);
        if (!failure) setNotice(`Renamed to “${value.trim()}” ${LOCAL}.`);
        return !failure;
      }}
    >
      <label className="field-label" htmlFor={inputId}>Name</label>
      <input id={inputId} className="command-input" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={error ? true : undefined} autoFocus />
    </FormDialog>
  );
}

export function MoveAction({ kind, ids, projectId, label }: { kind: "folder" | "asset"; ids: string[]; projectId: string; label: string }) {
  const { library, apply, setNotice } = useLibrary();
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selectId = useId();
  const destinations = Object.values(library.folders)
    .filter((f) => f.projectId === projectId && !isFolderHidden(library, f.id))
    .map((f) => ({ id: f.id, label: folderPath(library, f.id).map((p) => p.name).join(" / ") }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return (
    <FormDialog
      trigger={label} title={label} error={error}
      onOpen={() => { setTarget(""); setError(null); }}
      onSubmit={() => {
        const failure = apply((l) => move(l, kind, ids, target || null));
        setError(failure);
        if (!failure) setNotice(`Moved ${ids.length === 1 ? "1 item" : `${ids.length} items`} ${LOCAL}.`);
        return !failure;
      }}
    >
      <label className="field-label" htmlFor={selectId}>Destination</label>
      <select id={selectId} className="command-input" value={target} onChange={(e) => setTarget(e.target.value)}>
        <option value="">{library.projects[projectId]?.name ?? "Project"} (root)</option>
        {destinations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
      </select>
    </FormDialog>
  );
}

export function ArchiveAction({ kind, ids, label, onDone }: { kind: EntityKind; ids: string[]; label: string; onDone?: () => void }) {
  const { apply, setNotice } = useLibrary();
  return (
    <Button variant="secondary" size="sm" onClick={() => {
      const failure = apply((library) => setArchived(library, kind, ids, true));
      setNotice(failure ?? `Archived ${ids.length === 1 ? "1 item" : `${ids.length} items`} ${LOCAL}. Restore from Archive.`);
      if (!failure) onDone?.();
    }}>{label}</Button>
  );
}

export function Notice() {
  const { notice } = useLibrary();
  return <p className="notice" role="status">{notice}</p>;
}
