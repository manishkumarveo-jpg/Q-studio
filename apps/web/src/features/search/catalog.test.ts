import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSavedFilters, loadViewPrefs, SAVED_FILTERS_KEY, storeSavedFilters, VIEW_PREFS_KEY } from "../../lib/local-storage/preferences";
import { librarySeed, type Asset, type Library } from "../../services/mock/librarySeed";
import { setArchived, type Result } from "../projects/library";
import {
  addField, createCollection, deleteField, emptyQuery, markRecent, queryFromParams, queryToParams, searchAssets, setFavorite, setMembership, setValues,
  type AssetQuery,
} from "./catalog";

const NOW = "2026-10-26T13:00:00.000Z";
const unwrap = (result: Result) => {
  if (!result.ok) throw new Error(result.error);
  return result.library;
};
const names = (library: Library, query: Partial<AssetQuery>) => {
  const result = searchAssets(library, { ...emptyQuery, ...query });
  if (!result.ok) throw new Error(result.error);
  return result.assets.map((a) => a.name);
};

describe("TC-FE-006 / TC-UNIT-010 search and combined filters", () => {
  it("combines filters with AND and returns a deterministic name order", () => {
    expect(names(librarySeed, { kind: "video", fieldId: "mdf_status1", fieldValue: "in review" })).toEqual(["EP104_conform_v3.mov", "Trailer_A_color.mov"]);
    expect(names(librarySeed, { kind: "video", fieldId: "mdf_status1", fieldValue: "In review", projectId: "prj_3m9xh7" })).toEqual([]);
    expect(names(librarySeed, { favorites: true, kind: "audio" })).toEqual(["EP102_final_mix.wav"]);
    expect(names(librarySeed, { collectionId: "col_m4k9p2", text: "104" })).toEqual(["EP104_conform_v3.mov", "EP104_stems.wav"]);
    expect(names(librarySeed, { text: "  " })).toHaveLength(Object.keys(librarySeed.assets).length);
  });

  it("assets missing optional metadata never match a field filter; empty value means any value", () => {
    expect(names(librarySeed, { fieldId: "mdf_vendor1" })).toEqual(["EP104_conform_v3.mov", "EP104_stems.wav", "Trailer_A_color.mov"]);
    expect(names(librarySeed, { fieldId: "mdf_episode", fieldValue: "105" })).toEqual(["EP105_offline_v1.mp4"]);
    // Same answer when the values table has no entry at all for most assets.
    const sparse = { ...librarySeed, values: { ast_w8r5b4: { mdf_episode: "105" } } };
    expect(names(sparse, { fieldId: "mdf_episode", fieldValue: "105", text: "ep105" })).toEqual(["EP105_offline_v1.mp4"]);
  });

  it("text search covers project, folder path and live metadata; all terms must match", () => {
    expect(names(librarySeed, { text: "lumen trailer" })).toEqual(["Trailer_A_color.mov"]);
    expect(names(librarySeed, { text: "online conform" })).toEqual(["EP104_conform_v2.mov", "EP104_conform_v3.mov", "EP104_EDL.edl"]);
    expect(names(librarySeed, { text: "harbor still" })).toEqual(["Harbor_still_01.jpg", "Harbor_still_02.jpg"]);
    const deleted = unwrap(deleteField(librarySeed, "mdf_vendor1", NOW));
    expect(names(deleted, { text: "lumen" })).toEqual([]);
  });

  it("archived assets and assets in archived folders are excluded", () => {
    const archived = unwrap(setArchived(librarySeed, "folder", ["fld_a71c0e"], true, NOW));
    expect(names(archived, { text: "EP104" })).toEqual([]);
  });

  it("rejects stale or untrusted references with an error instead of guessing", () => {
    expect(searchAssets(librarySeed, { ...emptyQuery, kind: "<script>" })).toEqual({ ok: false, error: "That asset type is not recognised." });
    expect(searchAssets(librarySeed, { ...emptyQuery, projectId: "prj_other" }).ok).toBe(false);
    expect(searchAssets(librarySeed, { ...emptyQuery, collectionId: "col_gone" })).toEqual({ ok: false, error: "The selected collection no longer exists." });
    const deleted = unwrap(deleteField(librarySeed, "mdf_vendor1", NOW));
    expect(searchAssets(deleted, { ...emptyQuery, fieldId: "mdf_vendor1" })).toEqual({ ok: false, error: "The selected metadata field was deleted." });
  });

  it("round-trips URL params and drops unknown keys", () => {
    const query: AssetQuery = { ...emptyQuery, text: "a b", kind: "video", fieldId: "mdf_status1", fieldValue: "Draft", favorites: true };
    expect(queryFromParams(queryToParams(query))).toEqual(query);
    expect(queryToParams(queryFromParams(new URLSearchParams("q=x&evil=1&asset=ast_1"))).toString()).toBe("q=x");
  });
});

describe("TC-UNIT-011 collections reference assets without copying", () => {
  it("adding is idempotent and never duplicates or copies assets", () => {
    const once = unwrap(setMembership(librarySeed, "col_r8t1w6", ["ast_q2h8v1", "ast_x2s7c9"], true, NOW));
    const twice = unwrap(setMembership(once, "col_r8t1w6", ["ast_q2h8v1"], true, NOW));
    expect(twice.collections.col_r8t1w6.assetIds).toEqual(["ast_x2s7c9", "ast_y6t2d1", "ast_c1x4h3", "ast_q2h8v1"]);
    expect(twice.assets).toBe(librarySeed.assets);
    expect(Object.keys(twice.assets)).toHaveLength(Object.keys(librarySeed.assets).length);
    expect(librarySeed.collections.col_r8t1w6.assetIds).toHaveLength(3);
  });

  it("removing leaves the asset in its folder and in other collections", () => {
    const removed = unwrap(setMembership(librarySeed, "col_m4k9p2", ["ast_q2h8v1"], false, NOW));
    expect(removed.collections.col_m4k9p2.assetIds).not.toContain("ast_q2h8v1");
    expect(removed.assets.ast_q2h8v1).toBe(librarySeed.assets.ast_q2h8v1);
    expect(names(removed, { text: "EP104_conform_v3" })).toEqual(["EP104_conform_v3.mov"]);
  });

  it("validates collection names and references", () => {
    expect(createCollection(librarySeed, "marketing PICKS", "col_x", NOW)).toEqual({ ok: false, error: "A collection named “marketing PICKS” already exists." });
    expect(createCollection(librarySeed, "  ", "col_x", NOW).ok).toBe(false);
    expect(unwrap(createCollection(librarySeed, " Promo ", "col_x", NOW)).collections.col_x).toEqual({ id: "col_x", name: "Promo", assetIds: [], updatedAt: NOW });
    expect(setMembership(librarySeed, "col_gone", ["ast_q2h8v1"], true).ok).toBe(false);
    expect(setMembership(librarySeed, "col_m4k9p2", ["ast_gone"], true).ok).toBe(false);
  });

  it("favorites and recent are deduplicated ID lists", () => {
    const fav = unwrap(setFavorite(librarySeed, ["ast_q2h8v1", "ast_c1x4h3"], true));
    expect(fav.favorites).toEqual(["ast_q2h8v1", "ast_a5v3f2", "ast_c1x4h3"]);
    expect(unwrap(setFavorite(fav, ["ast_q2h8v1"], false)).favorites).toEqual(["ast_a5v3f2", "ast_c1x4h3"]);
    let lib = librarySeed;
    for (const id of ["ast_q2h8v1", "ast_c1x4h3", "ast_q2h8v1", "ast_gone"]) lib = markRecent(lib, id);
    expect(lib.recent).toEqual(["ast_q2h8v1", "ast_c1x4h3"]);
    const many = Object.keys(librarySeed.assets).reduce((l, id) => markRecent(l, id), { ...librarySeed, assets: { ...librarySeed.assets, ...Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`ast_n${i}`, { ...librarySeed.assets.ast_q2h8v1, id: `ast_n${i}` }])) } });
    expect(Array.from({ length: 30 }, (_, i) => `ast_n${i}`).reduce(markRecent, many).recent).toHaveLength(20);
  });
});

describe("TC-UNIT-012 metadata fields and values", () => {
  it("deleting a field keeps its values readable and blocks new writes", () => {
    const deleted = unwrap(deleteField(librarySeed, "mdf_vendor1", NOW));
    expect(deleted.fields.mdf_vendor1.deletedAt).toBe(NOW);
    expect(deleted.values.ast_q2h8v1.mdf_vendor1).toBe("Lumen Post");
    expect(setValues(deleted, "ast_q2h8v1", { mdf_vendor1: "Other" }).ok).toBe(false);
    expect(deleteField(deleted, "mdf_vendor1").ok).toBe(false);
    // Saving live fields keeps the deleted field's historical value.
    expect(unwrap(setValues(deleted, "ast_q2h8v1", { mdf_episode: "104B" })).values.ast_q2h8v1).toEqual({ mdf_status1: "In review", mdf_episode: "104B", mdf_vendor1: "Lumen Post" });
  });

  it("validates values and clears on empty without mutating input", () => {
    const before = structuredClone(librarySeed.values);
    expect(setValues(librarySeed, "ast_q2h8v1", { mdf_status1: "Shipped" })).toEqual({ ok: false, error: "Review status must be one of: Draft, In review, Approved." });
    expect(setValues(librarySeed, "ast_q2h8v1", { mdf_episode: "a\u0007" }).ok).toBe(false);
    expect(setValues(librarySeed, "ast_q2h8v1", { mdf_episode: "x".repeat(501) }).ok).toBe(false);
    expect(setValues(librarySeed, "ast_gone", { mdf_episode: "1" }).ok).toBe(false);
    const cleared = unwrap(setValues(librarySeed, "ast_q2h8v1", { mdf_episode: "  ", mdf_vendor1: " Acme " }));
    expect(cleared.values.ast_q2h8v1).toEqual({ mdf_status1: "In review", mdf_vendor1: "Acme" });
    const markup = "<img src=x onerror=alert(1)>";
    expect(unwrap(setValues(librarySeed, "ast_c1x4h3", { mdf_episode: markup })).values.ast_c1x4h3.mdf_episode).toBe(markup);
    expect(librarySeed.values).toEqual(before);
  });

  it("adds fields with deduplicated options and rejects duplicates", () => {
    const added = unwrap(addField(librarySeed, " Shot type ", "Wide, close, wide , ", "mdf_x"));
    expect(added.fields.mdf_x).toEqual({ id: "mdf_x", name: "Shot type", options: ["wide", "close"], deletedAt: null });
    expect(unwrap(addField(librarySeed, "Notes", "", "mdf_y")).fields.mdf_y.options).toBeNull();
    expect(addField(librarySeed, "vendor", "").ok).toBe(false);
    // A deleted field's name can be reused by a new field.
    expect(addField(unwrap(deleteField(librarySeed, "mdf_vendor1", NOW)), "Vendor", "", "mdf_z").ok).toBe(true);
    expect(addField(librarySeed, "Bad", "a/b").ok).toBe(false);
  });
});

describe("TC-UNIT-013 local preferences", () => {
  beforeEach(() => window.localStorage.clear());

  it("ignores corrupt or wrongly shaped storage", () => {
    window.localStorage.setItem(SAVED_FILTERS_KEY, "{not json");
    window.localStorage.setItem(VIEW_PREFS_KEY, JSON.stringify({ view: "carousel", sort: "evil" }));
    expect(loadSavedFilters()).toEqual([]);
    expect(loadViewPrefs()).toEqual({ view: "grid", sort: "name" });
    window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify([{ id: "f1", name: "Ok", params: "q=a" }, { id: 2 }, null]));
    expect(loadSavedFilters()).toEqual([{ id: "f1", name: "Ok", params: "q=a" }]);
  });

  it("reports a failed write instead of claiming success", () => {
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(storeSavedFilters([{ id: "f1", name: "x", params: "q=a" }])).toBe(false);
    spy.mockRestore();
    expect(storeSavedFilters([{ id: "f1", name: "x", params: "q=a" }])).toBe(true);
  });
});

describe("Phase 04 performance baseline", () => {
  const fixture = (n: number): Library => {
    const assets: Asset[] = Array.from({ length: n }, (_, i) => ({ ...librarySeed.assets.ast_q2h8v1, id: `ast_p${String(i).padStart(5, "0")}`, name: `Perf_${i}.mov` }));
    return { ...librarySeed, assets: Object.fromEntries(assets.map((a) => [a.id, a])), values: Object.fromEntries(assets.filter((_, i) => i % 2).map((a) => [a.id, { mdf_status1: "Draft" }])) };
  };

  it.each([50, 200])("search + combined filters over %i assets", (n) => {
    const library = fixture(n);
    const query = { ...emptyQuery, text: "perf", kind: "video", fieldId: "mdf_status1", fieldValue: "Draft" };
    const start = performance.now();
    for (let i = 0; i < 100; i++) searchAssets(library, query);
    const ms = (performance.now() - start) / 100;
    expect(names(library, query)).toHaveLength(n / 2);
    console.info(`[perf] searchAssets ${n} assets: ${ms.toFixed(3)} ms/query (jsdom)`);
  });
});
