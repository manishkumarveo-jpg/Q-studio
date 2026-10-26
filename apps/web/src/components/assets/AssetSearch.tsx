import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { isAssetVisible, validateName } from "../../features/projects/library";
import { useLibrary } from "../../features/projects/LibraryProvider";
import {
  addField, assetKinds, createCollection, deleteField, emptyQuery, newId, queryFromParams, queryToParams, searchAssets, type AssetQuery,
} from "../../features/search/catalog";
import { loadSavedFilters, SAVED_MAX, storeSavedFilters } from "../../lib/local-storage/preferences";
import { FormDialog, LOCAL } from "../projects/EntityActions";
import { Head } from "../projects/ProjectPages";
import { Button } from "../ui/Button";
import { StatusState } from "../ui/StatusState";
import { AssetList } from "./AssetList";

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true });
/** Re-serializes through the validated query shape so stored or pasted params can't carry extras. */
const cleanParams = (raw: string) => queryToParams(queryFromParams(new URLSearchParams(raw))).toString();

function SavedFilters({ current }: { current: string }) {
  const { setNotice } = useLibrary();
  const [saved, setSaved] = useState(loadSavedFilters);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const store = (next: typeof saved) => {
    if (!storeSavedFilters(next)) return "This browser blocked local storage, so nothing was saved.";
    setSaved(next);
    return null;
  };
  return (
    <section className="saved-filters" aria-label="Saved filters">
      <FormDialog
        trigger="Save filter" title="Save filter" error={error}
        onOpen={() => { setName(""); setError(null); }}
        onSubmit={() => {
          const failure = !current ? "Set at least one filter first."
            : saved.length >= SAVED_MAX ? `You can keep up to ${SAVED_MAX} saved filters. Delete one first.`
            : validateName(name) ?? store([...saved, { id: newId("flt"), name: name.trim(), params: current }]);
          setError(failure);
          if (!failure) setNotice(`Saved filter “${name.trim()}” in this browser only.`);
          return !failure;
        }}
      >
        <label className="field-label" htmlFor={inputId}>Filter name</label>
        <input id={inputId} className="command-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <p className="dialog-copy">Saved filters stay in this browser. They are not shared or synced.</p>
      </FormDialog>
      {saved.map((f) => (
        <span key={f.id} className="filter-chip">
          <Link to={`/assets?${cleanParams(f.params)}`}>{f.name}</Link>
          <button type="button" className="icon-button" aria-label={`Delete saved filter ${f.name}`} onClick={() => setNotice(store(saved.filter((s) => s.id !== f.id)) ?? `Deleted saved filter “${f.name}”.`)}><X size={13} /></button>
        </span>
      ))}
    </section>
  );
}

function ManageFieldsAction() {
  const { library, apply, setNotice } = useLibrary();
  const [name, setName] = useState("");
  const [options, setOptions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const baseId = useId();
  const fields = Object.values(library.fields).filter((f) => !f.deletedAt).sort(byName);
  return (
    <FormDialog
      trigger="Metadata fields" title="Metadata fields" error={error}
      onOpen={() => { setName(""); setOptions(""); setError(null); }}
      onSubmit={() => {
        const failure = apply((l) => addField(l, name, options));
        setError(failure);
        if (!failure) setNotice(`Added field “${name.trim()}” ${LOCAL}.`);
        return !failure;
      }}
    >
      <ul className="row-list" aria-label="Fields">
        {fields.map((f) => (
          <li key={f.id}>
            <p><strong>{f.name}</strong> · {f.options ? f.options.join(", ") : "Free text"}</p>
            <Button variant="ghost" size="sm" aria-label={`Delete field ${f.name}`} onClick={() => {
              const failure = apply((l) => deleteField(l, f.id));
              setError(failure);
              if (!failure) setNotice(`Deleted field “${f.name}” ${LOCAL}. Existing values stay readable on each asset.`);
            }}>Delete</Button>
          </li>
        ))}
      </ul>
      <label className="field-label" htmlFor={`${baseId}-name`}>New field name</label>
      <input id={`${baseId}-name`} className="command-input" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="field-label" htmlFor={`${baseId}-options`}>Options (comma separated, blank for free text)</label>
      <input id={`${baseId}-options`} className="command-input" value={options} onChange={(e) => setOptions(e.target.value)} />
    </FormDialog>
  );
}

export function AllAssetsPage() {
  const { library } = useLibrary();
  const [params, setParams] = useSearchParams();
  const query = queryFromParams(params);
  const current = queryToParams(query).toString();
  const result = useMemo(() => searchAssets(library, queryFromParams(new URLSearchParams(current))), [library, current]);
  const update = (patch: Partial<AssetQuery>) => setParams(queryToParams({ ...query, ...patch }), { replace: true });
  const clear = () => setParams({}, { replace: true });
  const field = library.fields[query.fieldId];
  const liveFields = Object.values(library.fields).filter((f) => !f.deletedAt).sort(byName);
  const clearButton = <Button variant="secondary" size="sm" onClick={clear}>Clear filters</Button>;

  return (
    <>
      <Head title="All Assets" />
      <form className="filter-bar" role="search" aria-label="Asset search" onSubmit={(e) => e.preventDefault()}>
        <input type="search" className="command-input" aria-label="Search assets" placeholder="Search names, folders and metadata…" value={query.text} onChange={(e) => update({ text: e.target.value })} />
        <label className="check">Type
          <select className="select" value={query.kind} onChange={(e) => update({ kind: e.target.value })}>
            <option value="">Any</option>{assetKinds.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="check">Project
          <select className="select" value={query.projectId} onChange={(e) => update({ projectId: e.target.value })}>
            <option value="">Any</option>{Object.values(library.projects).filter((p) => !p.archivedAt).sort(byName).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="check">Collection
          <select className="select" value={query.collectionId} onChange={(e) => update({ collectionId: e.target.value })}>
            <option value="">Any</option>{Object.values(library.collections).sort(byName).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="check">Field
          <select className="select" value={query.fieldId} onChange={(e) => update({ fieldId: e.target.value, fieldValue: "" })}>
            <option value="">Any</option>{liveFields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        {field && !field.deletedAt && (field.options ? (
          <label className="check">Value
            <select className="select" value={query.fieldValue} onChange={(e) => update({ fieldValue: e.target.value })}>
              <option value="">Any value</option>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        ) : (
          <label className="check">Value <input className="select" value={query.fieldValue} placeholder="Any value" onChange={(e) => update({ fieldValue: e.target.value })} /></label>
        ))}
        <label className="check"><input type="checkbox" checked={query.favorites} onChange={(e) => update({ favorites: e.target.checked })} /> Favorites only</label>
        {current && clearButton}
        <ManageFieldsAction />
      </form>
      <SavedFilters current={current} />
      {result.ok ? (
        <>
          <p className="result-count" role="status">{result.assets.length} of {Object.values(library.assets).filter((a) => isAssetVisible(library, a)).length} assets</p>
          <AssetList key={params.get("asset") ?? ""} assets={result.assets} showProject empty={
            <StatusState state="empty" title="No assets match these filters">Assets without a value for the chosen field never match it. {clearButton}</StatusState>
          } />
        </>
      ) : (
        <StatusState state="error" title="This search cannot run">{result.error} {clearButton}</StatusState>
      )}
    </>
  );
}

export function FavoritesPage() {
  const { library } = useLibrary();
  const result = searchAssets(library, { ...emptyQuery, favorites: true });
  return (
    <>
      <Head title="Favorites" />
      <AssetList assets={result.ok ? result.assets : []} showProject empty={
        <StatusState state="empty" title="No favorites yet">Open an asset's details and choose Favorite. <Link to="/assets">Browse all assets</Link>.</StatusState>
      } />
    </>
  );
}

export function RecentPage() {
  const { library } = useLibrary();
  const assets = library.recent.map((id) => library.assets[id]).filter((a) => a && isAssetVisible(library, a));
  return (
    <>
      <Head title="Recent" />
      <AssetList assets={assets} showProject empty={
        <StatusState state="empty" title="Nothing opened yet">Assets whose details you open in this browser tab appear here. <Link to="/assets">Browse all assets</Link>.</StatusState>
      } />
    </>
  );
}

function NewCollectionAction() {
  const { apply, setNotice } = useLibrary();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  return (
    <FormDialog
      trigger="New collection" title="New collection" error={error}
      onOpen={() => { setName(""); setError(null); }}
      onSubmit={() => {
        const failure = apply((l) => createCollection(l, name));
        setError(failure);
        if (!failure) setNotice(`Created collection “${name.trim()}” ${LOCAL}.`);
        return !failure;
      }}
    >
      <label className="field-label" htmlFor={inputId}>Name</label>
      <input id={inputId} className="command-input" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={error ? true : undefined} autoFocus />
    </FormDialog>
  );
}

export function CollectionsPage() {
  const { library } = useLibrary();
  const collections = Object.values(library.collections).sort(byName);
  const visible = (ids: string[]) => ids.filter((id) => library.assets[id] && isAssetVisible(library, library.assets[id])).length;
  return (
    <>
      <Head title="Collections" />
      <div className="toolbar"><NewCollectionAction /></div>
      {collections.length ? (
        <ul className="project-grid" aria-label="Collections">
          {collections.map((c) => (
            <li key={c.id}>
              <Link className="metric-card" to={`/collections/${c.id}`}>
                <strong>{c.name}</strong>
                <span className="metric-label">{visible(c.assetIds)} assets</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <StatusState state="empty" title="No collections yet">Create one, then add assets from their details panel. Assets are referenced, not copied.</StatusState>}
    </>
  );
}

export function CollectionPage() {
  const { collectionId = "" } = useParams();
  const { library } = useLibrary();
  const collection = library.collections[collectionId];
  if (!collection) {
    return <StatusState state="empty" title="This collection is not available">It does not exist in this demo library. <Link to="/collections">Back to collections</Link>.</StatusState>;
  }
  const members = collection.assetIds.map((id) => library.assets[id]).filter(Boolean);
  const assets = members.filter((a) => isAssetVisible(library, a));
  const hidden = members.length - assets.length;
  return (
    <>
      <Head title={collection.name} />
      {hidden > 0 && <p className="page-intro">{hidden} archived {hidden === 1 ? "asset stays" : "assets stay"} in this collection and reappear when restored.</p>}
      <AssetList assets={assets} collectionId={collection.id} showProject empty={
        <StatusState state="empty" title="This collection is empty">Add assets from <Link to="/assets">All Assets</Link> using Add to collection.</StatusState>
      } />
    </>
  );
}
