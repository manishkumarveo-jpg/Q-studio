import { FileAudio, FileImage, FileText, FileVideo, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { folderPath, sortAssets } from "../../features/projects/library";
import { useLibrary } from "../../features/projects/LibraryProvider";
import { markRecent } from "../../features/search/catalog";
import { loadViewPrefs, storeViewPrefs, type ViewPrefs } from "../../lib/local-storage/preferences";
import type { Asset } from "../../services/mock/librarySeed";
import { ArchiveAction, MoveAction, RenameAction } from "../projects/EntityActions";
import { AddToCollectionAction, EditMetadataAction, FavoriteToggle, RemoveFromCollectionAction } from "./CatalogActions";
import { Button } from "../ui/Button";
import { StatusState } from "../ui/StatusState";

const kindIcons = { video: FileVideo, image: FileImage, audio: FileAudio, document: FileText };

export const formatBytes = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : bytes >= 1e6 ? `${Math.round(bytes / 1e6)} MB` : `${Math.round(bytes / 1e3)} KB`;
export const formatDuration = (sec: number) =>
  [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map((n) => String(n).padStart(2, "0")).join(":");
const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

function MetadataRows({ assetId }: { assetId: string }) {
  const { library } = useLibrary();
  const values = library.values[assetId] ?? {};
  // Deleted fields stay listed while they hold a value so earlier metadata remains readable.
  const fields = Object.values(library.fields).filter((f) => !f.deletedAt || values[f.id]);
  return fields.map((f) => (
    <div key={f.id} className="dl-row">
      <dt>{f.name}{f.deletedAt && " (deleted field)"}</dt><dd>{values[f.id] ?? "Not set"}</dd>
    </div>
  ));
}

/**
 * Grid/list of assets with sorting, selection, bulk actions and a details panel. `projectId` enables
 * moves; `collectionId` adds remove-from-collection. `?asset=<id>` opens that asset's details.
 */
export function AssetList({ assets, projectId, collectionId, showProject = false, empty }: {
  assets: Asset[]; projectId?: string; collectionId?: string; showProject?: boolean; empty?: ReactNode;
}) {
  const { library, apply } = useLibrary();
  const [params] = useSearchParams();
  const [prefs, setPrefs] = useState(loadViewPrefs);
  const { sort, view } = prefs;
  const setPref = (patch: Partial<ViewPrefs>) => { const next = { ...prefs, ...patch }; setPrefs(next); storeViewPrefs(next); };
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [detailId, setDetail] = useState<string | null>(params.get("asset"));
  const setDetailId = (id: string | null) => {
    setDetail(id);
    if (id) apply((l) => ({ ok: true, library: markRecent(l, id) }));
  };
  const sorted = useMemo(() => sortAssets(assets, sort), [assets, sort]);
  // Drop selections/details for assets that were archived or moved out of this view.
  const selectedIds = sorted.filter((a) => selected.has(a.id)).map((a) => a.id);
  const detail = sorted.find((a) => a.id === detailId);
  const allSelected = sorted.length > 0 && selectedIds.length === sorted.length;

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });

  if (!assets.length) {
    return empty ?? (
      <StatusState state="empty" title="No assets here">
        Uploads arrive in Phase 07. You can move an existing asset here, or <Link to="/assets">browse all assets</Link>.
      </StatusState>
    );
  }

  return (
    <div className={`asset-area${detail ? " asset-area--details" : ""}`}>
      <div>
        <div className="toolbar" role="toolbar" aria-label="Asset view">
          <label className="check"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(sorted.map((a) => a.id)))} /> Select all</label>
          <label className="check">Sort
            <select className="select" value={sort} onChange={(e) => setPref({ sort: e.target.value as ViewPrefs["sort"] })}>
              <option value="name">Name</option><option value="updated">Last updated</option><option value="size">Size</option>
            </select>
          </label>
          <div className="segmented">
            {(["grid", "list"] as const).map((v) => (
              <Button key={v} variant="ghost" size="sm" aria-pressed={view === v} onClick={() => setPref({ view: v })}>{v === "grid" ? "Grid" : "List"}</Button>
            ))}
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="bulk-bar" role="region" aria-label="Bulk actions">
            <span>{selectedIds.length} selected</span>
            {projectId && <MoveAction kind="asset" ids={selectedIds} projectId={projectId} label="Move selected" />}
            <AddToCollectionAction ids={selectedIds} label="Add selected to collection" />
            {collectionId && <RemoveFromCollectionAction collectionId={collectionId} ids={selectedIds} label="Remove selected from collection" />}
            <FavoriteToggle ids={selectedIds} label="Favorite selected" />
            <ArchiveAction kind="asset" ids={selectedIds} label="Archive selected" />
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
        )}
        <ul className={`asset-items asset-items--${view}`} aria-label="Assets">
          {sorted.map((asset) => {
            const Icon = kindIcons[asset.kind];
            return (
              <li key={asset.id} className={`asset-item${selected.has(asset.id) ? " asset-item--selected" : ""}`}>
                <input type="checkbox" checked={selected.has(asset.id)} onChange={() => toggle(asset.id)} aria-label={`Select ${asset.name}`} />
                <div className="asset-preview" aria-hidden="true"><Icon size={view === "grid" ? 28 : 16} />{asset.durationSec !== null && view === "grid" && <span>{formatDuration(asset.durationSec)}</span>}</div>
                <button type="button" className="asset-name" onClick={() => setDetailId(asset.id)} aria-label={`Details for ${asset.name}`}>{asset.name}</button>
                <span className="asset-meta">{showProject && `${library.projects[asset.projectId]?.name} · `}{asset.kind} · {formatBytes(asset.sizeBytes)}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {detail && (
        <aside className="panel asset-details" aria-label="Asset details">
          <div className="panel-head"><h2>{detail.name}</h2><button type="button" className="icon-button" aria-label="Close details" onClick={() => setDetailId(null)}><X size={16} /></button></div>
          <dl>
            <dt>ID</dt><dd><code>{detail.id}</code></dd>
            <dt>Type</dt><dd>{detail.kind}</dd>
            <dt>Size</dt><dd>{formatBytes(detail.sizeBytes)}</dd>
            {detail.durationSec !== null && <><dt>Duration</dt><dd>{formatDuration(detail.durationSec)}</dd></>}
            <dt>Location</dt><dd>{[library.projects[detail.projectId]?.name, ...folderPath(library, detail.folderId).map((f) => f.name)].join(" / ")}</dd>
            <dt>Updated</dt><dd>{formatDate(detail.updatedAt)}</dd>
            <dt>Preview</dt><dd>Placeholder. Media playback arrives in Phase 08.</dd>
            <MetadataRows assetId={detail.id} />
          </dl>
          <div className="toolbar">
            <FavoriteToggle ids={[detail.id]} />
            <EditMetadataAction key={detail.id} assetId={detail.id} />
            <AddToCollectionAction ids={[detail.id]} label="Add to collection" />
            {collectionId && <RemoveFromCollectionAction collectionId={collectionId} ids={[detail.id]} label="Remove from collection" />}
            <RenameAction key={detail.id} kind="asset" id={detail.id} name={detail.name} />
            <MoveAction kind="asset" ids={[detail.id]} projectId={detail.projectId} label="Move asset" />
            <ArchiveAction kind="asset" ids={[detail.id]} label="Archive asset" />
          </div>
        </aside>
      )}
    </div>
  );
}
