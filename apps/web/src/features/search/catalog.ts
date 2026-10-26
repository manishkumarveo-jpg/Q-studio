import type { Asset, AssetKind, Library } from "../../services/mock/librarySeed";
import { folderPath, isAssetVisible, sortAssets, validateName, type Result } from "../projects/library";

// Pure search, metadata, collection and favorite operations on the local library. Like library.ts,
// each returns a new library or an error and never mutates its input.
const VALUE_MAX = 500;
const RECENT_MAX = 20;
export const assetKinds: AssetKind[] = ["video", "image", "audio", "document"];
const norm = (value: string) => value.trim().toLocaleLowerCase();
const fail = (error: string): Result => ({ ok: false, error });
const ok = (library: Library): Result => ({ ok: true, library });
export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

export type AssetQuery = { text: string; kind: string; projectId: string; collectionId: string; fieldId: string; fieldValue: string; favorites: boolean };
export const emptyQuery: AssetQuery = { text: "", kind: "", projectId: "", collectionId: "", fieldId: "", fieldValue: "", favorites: false };

// URL params are untrusted; searchAssets validates every referenced ID and value.
const paramKeys = { text: "q", kind: "kind", projectId: "project", collectionId: "collection", fieldId: "field", fieldValue: "value" } as const;

export function queryFromParams(params: URLSearchParams): AssetQuery {
  const query = { ...emptyQuery, favorites: params.get("favorites") === "1" };
  for (const [key, param] of Object.entries(paramKeys)) query[key as keyof typeof paramKeys] = params.get(param) ?? "";
  return query;
}

export function queryToParams(query: AssetQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, param] of Object.entries(paramKeys)) if (query[key as keyof typeof paramKeys]) params.set(param, query[key as keyof typeof paramKeys]);
  if (query.favorites) params.set("favorites", "1");
  return params;
}

export type SearchResult = { ok: true; assets: Asset[] } | { ok: false; error: string };

/**
 * All filters combine with AND. An asset with no value for the filtered field never matches; an
 * empty `fieldValue` means "has any value". Results are name-sorted with an ID tie-break.
 */
export function searchAssets(library: Library, query: AssetQuery): SearchResult {
  if (query.kind && !assetKinds.includes(query.kind as AssetKind)) return { ok: false, error: "That asset type is not recognised." };
  if (query.projectId && !library.projects[query.projectId]) return { ok: false, error: "The selected project is not available." };
  const collection = query.collectionId ? library.collections[query.collectionId] : undefined;
  if (query.collectionId && !collection) return { ok: false, error: "The selected collection no longer exists." };
  const field = query.fieldId ? library.fields[query.fieldId] : undefined;
  if (query.fieldId && (!field || field.deletedAt)) return { ok: false, error: "The selected metadata field was deleted." };

  const terms = norm(query.text).split(/\s+/).filter(Boolean);
  const members = collection && new Set(collection.assetIds);
  const favorites = new Set(library.favorites);
  const liveFields = Object.values(library.fields).filter((f) => !f.deletedAt);
  const wanted = norm(query.fieldValue);
  const assets = Object.values(library.assets).filter((asset) => {
    if (!isAssetVisible(library, asset)) return false;
    if (query.kind && asset.kind !== query.kind) return false;
    if (query.projectId && asset.projectId !== query.projectId) return false;
    if (members && !members.has(asset.id)) return false;
    if (query.favorites && !favorites.has(asset.id)) return false;
    const values = library.values[asset.id] ?? {};
    if (field) {
      const value = norm(values[field.id] ?? "");
      if (!value || (wanted && value !== wanted)) return false;
    }
    if (!terms.length) return true;
    const haystack = norm([
      asset.name, library.projects[asset.projectId]?.name ?? "", ...folderPath(library, asset.folderId).map((f) => f.name),
      ...liveFields.map((f) => values[f.id] ?? ""),
    ].join(" "));
    return terms.every((term) => haystack.includes(term));
  });
  return { ok: true, assets: sortAssets(assets, "name") };
}

function parseOptions(raw: string): string[] | null | string {
  const options = [...new Map(raw.split(",").map((o) => o.trim()).filter(Boolean).map((o) => [norm(o), o])).values()];
  const invalid = options.map(validateName).find(Boolean);
  return invalid ? `Option: ${invalid}` : options.length ? options : null;
}

export function addField(library: Library, rawName: string, rawOptions: string, id = newId("mdf")): Result {
  const invalid = validateName(rawName);
  if (invalid) return fail(invalid);
  const name = rawName.trim();
  if (Object.values(library.fields).some((f) => !f.deletedAt && norm(f.name) === norm(name))) return fail(`A field named “${name}” already exists.`);
  const options = parseOptions(rawOptions);
  if (typeof options === "string") return fail(options);
  return ok({ ...library, fields: { ...library.fields, [id]: { id, name, options, deletedAt: null } } });
}

/** Soft delete: the field leaves pickers and search, but stored values remain readable. */
export function deleteField(library: Library, id: string, now = new Date().toISOString()): Result {
  const field = library.fields[id];
  if (!field || field.deletedAt) return fail("This field no longer exists.");
  return ok({ ...library, fields: { ...library.fields, [id]: { ...field, deletedAt: now } } });
}

/** Sets live field values on one asset. Empty strings clear a value; deleted-field values are kept. */
export function setValues(library: Library, assetId: string, input: Record<string, string>): Result {
  if (!library.assets[assetId]) return fail("This asset no longer exists.");
  const next = { ...library.values[assetId] };
  for (const [fieldId, raw] of Object.entries(input)) {
    const field = library.fields[fieldId];
    if (!field || field.deletedAt) return fail("A metadata field was deleted. Reopen the editor.");
    const value = raw.trim();
    if (!value) { delete next[fieldId]; continue; }
    if (value.length > VALUE_MAX) return fail(`${field.name} must be ${VALUE_MAX} characters or fewer.`);
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(value)) return fail(`${field.name} cannot contain control characters.`);
    if (field.options && !field.options.includes(value)) return fail(`${field.name} must be one of: ${field.options.join(", ")}.`);
    next[fieldId] = value;
  }
  return ok({ ...library, values: { ...library.values, [assetId]: next } });
}

export function createCollection(library: Library, rawName: string, id = newId("col"), now = new Date().toISOString()): Result {
  const invalid = validateName(rawName);
  if (invalid) return fail(invalid);
  const name = rawName.trim();
  if (Object.values(library.collections).some((c) => norm(c.name) === norm(name))) return fail(`A collection named “${name}” already exists.`);
  return ok({ ...library, collections: { ...library.collections, [id]: { id, name, assetIds: [], updatedAt: now } } });
}

/** Adds or removes asset references. Idempotent: an asset is never listed twice. */
export function setMembership(library: Library, collectionId: string, assetIds: string[], member: boolean, now = new Date().toISOString()): Result {
  const collection = library.collections[collectionId];
  if (!collection) return fail("This collection no longer exists.");
  if (assetIds.some((id) => !library.assets[id])) return fail("One of the selected assets no longer exists.");
  const ids = new Set(collection.assetIds);
  for (const id of assetIds) if (member) ids.add(id); else ids.delete(id);
  return ok({ ...library, collections: { ...library.collections, [collectionId]: { ...collection, assetIds: [...ids], updatedAt: now } } });
}

export function setFavorite(library: Library, assetIds: string[], favorite: boolean): Result {
  if (assetIds.some((id) => !library.assets[id])) return fail("One of the selected assets no longer exists.");
  const ids = new Set(library.favorites);
  for (const id of assetIds) if (favorite) ids.add(id); else ids.delete(id);
  return ok({ ...library, favorites: [...ids] });
}

/** Most recent first, deduplicated, capped. Unknown IDs are ignored. */
export function markRecent(library: Library, assetId: string): Library {
  if (!library.assets[assetId] || library.recent[0] === assetId) return library;
  return { ...library, recent: [assetId, ...library.recent.filter((id) => id !== assetId)].slice(0, RECENT_MAX) };
}
