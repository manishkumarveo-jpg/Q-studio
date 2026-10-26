// Per-browser conveniences only. Stored values are untrusted: each read is shape-checked and any
// storage failure (private mode, quota, blocked) falls back to defaults instead of throwing.
export type SavedFilter = { id: string; name: string; params: string };
export type ViewPrefs = { view: "grid" | "list"; sort: "name" | "updated" | "size" };

export const SAVED_FILTERS_KEY = "qc-studio-saved-filters";
export const VIEW_PREFS_KEY = "qc-studio-asset-view";
export const SAVED_MAX = 20;

function read(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const isSaved = (v: unknown): v is SavedFilter =>
  !!v && typeof v === "object" && ["id", "name", "params"].every((k) => typeof (v as Record<string, unknown>)[k] === "string");

export function loadSavedFilters(): SavedFilter[] {
  const value = read(SAVED_FILTERS_KEY);
  return Array.isArray(value) ? value.filter(isSaved).slice(0, SAVED_MAX) : [];
}

/** Returns false when the browser refused to store it, so the UI never claims a save that failed. */
export const storeSavedFilters = (filters: SavedFilter[]) => write(SAVED_FILTERS_KEY, filters.slice(0, SAVED_MAX));

export function loadViewPrefs(): ViewPrefs {
  const value = read(VIEW_PREFS_KEY) as Partial<ViewPrefs> | null;
  return {
    view: value?.view === "list" ? "list" : "grid",
    sort: value?.sort === "updated" || value?.sort === "size" ? value.sort : "name",
  };
}

export const storeViewPrefs = (prefs: ViewPrefs) => write(VIEW_PREFS_KEY, prefs);
