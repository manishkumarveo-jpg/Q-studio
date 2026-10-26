import type { Asset, Folder, Library, Project } from "../../services/mock/librarySeed";

// Pure operations on the normalized local library. Every operation returns a new library or an
// error and never mutates its input, so a failed rename/move leaves the prior state untouched.
export type EntityKind = "project" | "folder" | "asset";
export type Result = { ok: true; library: Library } | { ok: false; error: string };

const tables = { project: "projects", folder: "folders", asset: "assets" } as const;
const NAME_MAX = 120;
const norm = (name: string) => name.trim().toLocaleLowerCase();
const fail = (error: string): Result => ({ ok: false, error });

function get(library: Library, kind: EntityKind, id: string) {
  return library[tables[kind]][id] as Project | Folder | Asset | undefined;
}

function put(library: Library, kind: EntityKind, entity: Project | Folder | Asset): Library {
  const table = tables[kind];
  return { ...library, [table]: { ...library[table], [entity.id]: entity } };
}

const parentOf = (kind: EntityKind, entity: object) =>
  kind === "folder" ? (entity as Folder).parentId : kind === "asset" ? (entity as Asset).folderId : null;

export function validateName(raw: string): string | null {
  const name = raw.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  // eslint-disable-next-line no-control-regex
  if (/[/\\\u0000-\u001f\u007f]/.test(name)) return "Name cannot contain slashes or control characters.";
  return null;
}

// Archived siblings count too, so restoring an item can never create a duplicate name.
function nameTaken(library: Library, kind: EntityKind, id: string, name: string, parentId: string | null) {
  const self = get(library, kind, id) as Folder | Asset;
  const peers: { id: string; name: string }[] =
    kind === "project" ? Object.values(library.projects)
    : kind === "folder" ? Object.values(library.folders).filter((f) => f.projectId === self.projectId && f.parentId === parentId)
    : Object.values(library.assets).filter((a) => a.projectId === self.projectId && a.folderId === parentId);
  return peers.some((peer) => peer.id !== id && norm(peer.name) === norm(name));
}

/** True when the folder (or any ancestor) is archived. `null` is the project root. */
export function isFolderHidden(library: Library, folderId: string | null): boolean {
  for (let id = folderId; id; id = library.folders[id]?.parentId ?? null) {
    if (!library.folders[id] || library.folders[id].archivedAt) return true;
  }
  return false;
}

export function isAssetVisible(library: Library, asset: Asset) {
  return !asset.archivedAt && !library.projects[asset.projectId]?.archivedAt && !isFolderHidden(library, asset.folderId);
}

export function folderPath(library: Library, folderId: string | null): Folder[] {
  const path: Folder[] = [];
  for (let id = folderId; id && library.folders[id]; id = library.folders[id].parentId) path.unshift(library.folders[id]);
  return path;
}

export function rename(library: Library, kind: EntityKind, id: string, raw: string, now = new Date().toISOString()): Result {
  const entity = get(library, kind, id);
  if (!entity) return fail("This item no longer exists.");
  const invalid = validateName(raw);
  if (invalid) return fail(invalid);
  const name = raw.trim();
  if (nameTaken(library, kind, id, name, parentOf(kind, entity))) return fail(`Another item here is already named “${name}”.`);
  return { ok: true, library: put(library, kind, { ...entity, name, updatedAt: now }) };
}

export function setArchived(library: Library, kind: EntityKind, ids: string[], archived: boolean, now = new Date().toISOString()): Result {
  let next = library;
  for (const id of ids) {
    const entity = get(next, kind, id);
    if (!entity) return fail("One of the selected items no longer exists.");
    next = put(next, kind, { ...entity, archivedAt: archived ? now : null, updatedAt: now });
  }
  return { ok: true, library: next };
}

/** Moves folders or assets into `targetFolderId` (`null` = project root) of the same project. */
export function move(library: Library, kind: "folder" | "asset", ids: string[], targetFolderId: string | null, now = new Date().toISOString()): Result {
  const target = targetFolderId ? library.folders[targetFolderId] : null;
  if (targetFolderId && (!target || isFolderHidden(library, targetFolderId))) return fail("The destination folder is not available.");
  let next = library;
  for (const id of ids) {
    const entity = get(next, kind, id) as Folder | Asset | undefined;
    if (!entity) return fail("One of the selected items no longer exists.");
    if (target && target.projectId !== entity.projectId) return fail("Items can only move within their own project.");
    if (kind === "folder" && folderPath(next, targetFolderId).some((f) => f.id === id)) {
      return fail("A folder cannot move into itself or one of its subfolders.");
    }
    if (nameTaken(next, kind, id, entity.name, targetFolderId)) return fail(`The destination already contains “${entity.name}”.`);
    next = put(next, kind, kind === "folder" ? { ...(entity as Folder), parentId: targetFolderId, updatedAt: now } : { ...(entity as Asset), folderId: targetFolderId, updatedAt: now });
  }
  return { ok: true, library: next };
}

export type SortKey = "name" | "updated" | "size";
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function sortAssets(assets: Asset[], key: SortKey): Asset[] {
  const compare: Record<SortKey, (a: Asset, b: Asset) => number> = {
    name: (a, b) => collator.compare(a.name, b.name),
    updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
    size: (a, b) => b.sizeBytes - a.sizeBytes,
  };
  return [...assets].sort((a, b) => compare[key](a, b) || a.id.localeCompare(b.id));
}
