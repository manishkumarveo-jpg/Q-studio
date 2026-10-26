import { Star } from "lucide-react";
import { useId, useState } from "react";
import { setFavorite, setMembership, setValues } from "../../features/search/catalog";
import { useLibrary } from "../../features/projects/LibraryProvider";
import { FormDialog, LOCAL } from "../projects/EntityActions";
import { Button } from "../ui/Button";

const count = (ids: string[]) => (ids.length === 1 ? "1 asset" : `${ids.length} assets`);

export function FavoriteToggle({ ids, label }: { ids: string[]; label?: string }) {
  const { library, apply, setNotice } = useLibrary();
  const on = ids.every((id) => library.favorites.includes(id));
  return (
    <Button variant="secondary" size="sm" aria-pressed={on} onClick={() => {
      const failure = apply((l) => setFavorite(l, ids, !on));
      setNotice(failure ?? `${on ? "Removed" : "Added"} ${count(ids)} ${on ? "from" : "to"} Favorites ${LOCAL}.`);
    }}><Star size={14} aria-hidden="true" fill={on ? "currentColor" : "none"} />{label ?? (on ? "Favorited" : "Favorite")}</Button>
  );
}

export function AddToCollectionAction({ ids, label }: { ids: string[]; label: string }) {
  const { library, apply, setNotice } = useLibrary();
  const collections = Object.values(library.collections).sort((a, b) => a.name.localeCompare(b.name));
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const selectId = useId();
  if (!collections.length) return null;
  return (
    <FormDialog
      trigger={label} title={label} error={error}
      onOpen={() => { setTarget(collections[0].id); setError(null); }}
      onSubmit={() => {
        const failure = apply((l) => setMembership(l, target, ids, true));
        setError(failure);
        if (!failure) setNotice(`Added ${count(ids)} to “${library.collections[target]?.name}” ${LOCAL}. Assets are referenced, not copied.`);
        return !failure;
      }}
    >
      <label className="field-label" htmlFor={selectId}>Collection</label>
      <select id={selectId} className="command-input" value={target} onChange={(e) => setTarget(e.target.value)}>
        {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </FormDialog>
  );
}

export function RemoveFromCollectionAction({ collectionId, ids, label }: { collectionId: string; ids: string[]; label: string }) {
  const { apply, setNotice } = useLibrary();
  return (
    <Button variant="secondary" size="sm" onClick={() => {
      const failure = apply((l) => setMembership(l, collectionId, ids, false));
      setNotice(failure ?? `Removed ${count(ids)} from this collection ${LOCAL}. The assets themselves are unchanged.`);
    }}>{label}</Button>
  );
}

export function EditMetadataAction({ assetId }: { assetId: string }) {
  const { library, apply, setNotice } = useLibrary();
  const fields = Object.values(library.fields).filter((f) => !f.deletedAt);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const baseId = useId();
  if (!fields.length) return null;
  return (
    <FormDialog
      trigger="Edit metadata" title="Edit metadata" error={error}
      onOpen={() => { setDraft(Object.fromEntries(fields.map((f) => [f.id, library.values[assetId]?.[f.id] ?? ""]))); setError(null); }}
      onSubmit={() => {
        const failure = apply((l) => setValues(l, assetId, draft));
        setError(failure);
        if (!failure) setNotice(`Saved metadata ${LOCAL}.`);
        return !failure;
      }}
    >
      {fields.map((f) => {
        const id = `${baseId}-${f.id}`;
        const set = (value: string) => setDraft((d) => ({ ...d, [f.id]: value }));
        return (
          <div key={f.id} className="dialog-form">
            <label className="field-label" htmlFor={id}>{f.name}</label>
            {f.options ? (
              <select id={id} className="command-input" value={draft[f.id] ?? ""} onChange={(e) => set(e.target.value)}>
                <option value="">Not set</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : <input id={id} className="command-input" value={draft[f.id] ?? ""} onChange={(e) => set(e.target.value)} />}
          </div>
        );
      })}
    </FormDialog>
  );
}
