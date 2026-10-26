import { describe, expect, it } from "vitest";
import { librarySeed } from "../../services/mock/librarySeed";
import { folderPath, isAssetVisible, move, rename, setArchived, sortAssets, validateName } from "./library";

const NOW = "2026-10-26T12:00:00.000Z";
const ids = (lib = librarySeed) => ({ projects: Object.keys(lib.projects), folders: Object.keys(lib.folders), assets: Object.keys(lib.assets) });
const unwrap = (result: ReturnType<typeof rename>) => {
  if (!result.ok) throw new Error(result.error);
  return result.library;
};

describe("TC-UNIT-009 library stable-ID fixtures", () => {
  it("seed IDs are unique, opaque and every relationship resolves", () => {
    const all = [...ids().projects, ...ids().folders, ...ids().assets];
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(id).toMatch(/^(prj|fld|ast)_[a-z0-9]{6}$/);
    for (const f of Object.values(librarySeed.folders)) {
      expect(librarySeed.projects[f.projectId]).toBeDefined();
      if (f.parentId) expect(librarySeed.folders[f.parentId].projectId).toBe(f.projectId);
    }
    for (const a of Object.values(librarySeed.assets)) {
      expect(librarySeed.projects[a.projectId]).toBeDefined();
      if (a.folderId) expect(librarySeed.folders[a.folderId].projectId).toBe(a.projectId);
    }
  });

  it("renaming and archiving a folder keeps every child and asset identity", () => {
    const renamed = unwrap(rename(librarySeed, "folder", "fld_a71c0e", "  EP104 (locked) ", NOW));
    expect(renamed.folders.fld_a71c0e.name).toBe("EP104 (locked)");
    const archived = unwrap(setArchived(renamed, "folder", ["fld_a71c0e"], true, NOW));
    expect(ids(archived)).toEqual(ids());
    expect(archived.folders.fld_c4e9k2.parentId).toBe("fld_a71c0e");
    expect(archived.assets.ast_q2h8v1.folderId).toBe("fld_c4e9k2");
    // Descendant assets are hidden while an ancestor is archived, and return on restore.
    expect(isAssetVisible(archived, archived.assets.ast_q2h8v1)).toBe(false);
    const restored = unwrap(setArchived(archived, "folder", ["fld_a71c0e"], false, NOW));
    expect(isAssetVisible(restored, restored.assets.ast_q2h8v1)).toBe(true);
    expect(folderPath(restored, "fld_c4e9k2").map((f) => f.name)).toEqual(["EP104 (locked)", "Online conform"]);
  });

  it("moves keep the asset ID and change only its folder", () => {
    const moved = unwrap(move(librarySeed, "asset", ["ast_s1m9x2"], "fld_e6p3r9", NOW));
    expect(moved.assets.ast_s1m9x2).toEqual({ ...librarySeed.assets.ast_s1m9x2, folderId: "fld_e6p3r9", updatedAt: NOW });
  });
});

describe("invalid names and moves preserve the prior state", () => {
  it.each([
    ["", "Name is required."],
    ["   ", "Name is required."],
    ["a/b", "Name cannot contain slashes or control characters."],
    ["tab\there", "Name cannot contain slashes or control characters."],
    ["x".repeat(121), "Name must be 120 characters or fewer."],
  ])("rejects %j", (name, error) => {
    expect(validateName(name)).toBe(error);
    expect(rename(librarySeed, "asset", "ast_q2h8v1", name)).toEqual({ ok: false, error });
  });

  it("rejects a case-insensitive duplicate sibling name, including archived siblings", () => {
    expect(rename(librarySeed, "asset", "ast_q2h8v1", "ep104_conform_V2.mov").ok).toBe(false);
    const archived = unwrap(setArchived(librarySeed, "asset", ["ast_r7k3w5"], true, NOW));
    expect(rename(archived, "asset", "ast_q2h8v1", "EP104_conform_v2.mov").ok).toBe(false);
    // Same name in a different folder is fine.
    expect(rename(librarySeed, "asset", "ast_q2h8v1", "EP105_offline_v1.mp4").ok).toBe(true);
  });

  it("rejects moving a folder into itself or a descendant", () => {
    expect(move(librarySeed, "folder", ["fld_a71c0e"], "fld_a71c0e")).toEqual({ ok: false, error: "A folder cannot move into itself or one of its subfolders." });
    expect(move(librarySeed, "folder", ["fld_a71c0e"], "fld_c4e9k2").ok).toBe(false);
  });

  it("rejects cross-project, archived and conflicting destinations", () => {
    expect(move(librarySeed, "asset", ["ast_q2h8v1"], "fld_g8n2t6")).toEqual({ ok: false, error: "Items can only move within their own project." });
    const archived = unwrap(setArchived(librarySeed, "folder", ["fld_a71c0e"], true, NOW));
    expect(move(archived, "asset", ["ast_v3q1a7"], "fld_d2v8m5").ok).toBe(false);
    expect(move(librarySeed, "asset", ["ast_q2h8v1"], "missing")).toEqual({ ok: false, error: "The destination folder is not available." });
    const dup = unwrap(rename(librarySeed, "asset", "ast_v3q1a7", "EP104_EDL.edl", NOW));
    expect(move(dup, "asset", ["ast_v3q1a7"], "fld_c4e9k2").ok).toBe(false);
  });

  it("a failed bulk move changes nothing", () => {
    const before = structuredClone(librarySeed);
    expect(move(librarySeed, "asset", ["ast_v3q1a7", "ast_q2h8v1", "ast_a5v3f2"], "fld_f1w7s3").ok).toBe(false);
    expect(librarySeed).toEqual(before);
  });
});

it("sorts deterministically with an ID tiebreak", () => {
  const assets = Object.values(librarySeed.assets);
  expect(sortAssets(assets, "size")[0].id).toBe("ast_b9w6g7");
  expect(sortAssets(assets, "updated")[0].updatedAt >= sortAssets(assets, "updated")[1].updatedAt).toBe(true);
  expect(sortAssets(assets, "name").map((a) => a.id)).toEqual(sortAssets([...assets].reverse(), "name").map((a) => a.id));
});
