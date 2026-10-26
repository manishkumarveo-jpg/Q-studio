// Deterministic demo library. Normalized by ID so renames/moves/archives never change identities.
// Nothing here comes from a server; the UI must label it as Demo data.
export type AssetKind = "video" | "image" | "audio" | "document";
export type Project = { id: string; name: string; updatedAt: string; archivedAt: string | null };
export type Folder = { id: string; projectId: string; parentId: string | null; name: string; updatedAt: string; archivedAt: string | null };
export type Asset = {
  id: string; projectId: string; folderId: string | null; name: string; kind: AssetKind;
  sizeBytes: number; durationSec: number | null; updatedAt: string; archivedAt: string | null;
};
/** `options: null` is free text. Deleted fields keep their values so history stays readable. */
export type MetadataField = { id: string; name: string; options: string[] | null; deletedAt: string | null };
/** Collections reference asset IDs; they never copy assets. */
export type Collection = { id: string; name: string; assetIds: string[]; updatedAt: string };
export type Library = {
  projects: Record<string, Project>; folders: Record<string, Folder>; assets: Record<string, Asset>;
  fields: Record<string, MetadataField>; values: Record<string, Record<string, string>>;
  collections: Record<string, Collection>; favorites: string[]; recent: string[];
};

export const byId = <T extends { id: string }>(items: T[]): Record<string, T> => Object.fromEntries(items.map((item) => [item.id, item]));

const at = (hoursAgo: number) => new Date(Date.UTC(2026, 9, 26, 12) - hoursAgo * 3_600_000).toISOString();

const projects: Project[] = [
  { id: "prj_8f2kq1", name: "Northbound S1", updatedAt: at(2), archivedAt: null },
  { id: "prj_3m9xh7", name: "Harbor Lights", updatedAt: at(26), archivedAt: null },
  { id: "prj_5t0bz4", name: "Brand Spots Q4", updatedAt: at(72), archivedAt: null },
];

const folder = (id: string, projectId: string, parentId: string | null, name: string, hoursAgo: number): Folder =>
  ({ id, projectId, parentId, name, updatedAt: at(hoursAgo), archivedAt: null });

const folders: Folder[] = [
  folder("fld_a71c0e", "prj_8f2kq1", null, "EP104", 2),
  folder("fld_c4e9k2", "prj_8f2kq1", "fld_a71c0e", "Online conform", 2),
  folder("fld_d2v8m5", "prj_8f2kq1", "fld_a71c0e", "Audio", 6),
  folder("fld_e6p3r9", "prj_8f2kq1", null, "EP105", 9),
  folder("fld_f1w7s3", "prj_8f2kq1", null, "Trailers", 5),
  folder("fld_g8n2t6", "prj_3m9xh7", null, "EP102", 26),
  folder("fld_h3j5u1", "prj_3m9xh7", null, "Stills", 40),
  folder("fld_k9b4w8", "prj_5t0bz4", null, "Scripts", 72),
];

type Row = [id: string, projectId: string, folderId: string | null, name: string, kind: AssetKind, sizeMb: number, durationSec: number | null, hoursAgo: number];
const rows: Row[] = [
  ["ast_q2h8v1", "prj_8f2kq1", "fld_c4e9k2", "EP104_conform_v3.mov", "video", 18_400, 2_712, 2],
  ["ast_r7k3w5", "prj_8f2kq1", "fld_c4e9k2", "EP104_conform_v2.mov", "video", 18_350, 2_709, 30],
  ["ast_s1m9x2", "prj_8f2kq1", "fld_c4e9k2", "EP104_EDL.edl", "document", 1, null, 30],
  ["ast_t5n4y8", "prj_8f2kq1", "fld_d2v8m5", "EP104_stems.wav", "audio", 2_100, 2_712, 6],
  ["ast_u9p6z3", "prj_8f2kq1", "fld_d2v8m5", "EP104_mix_ref.wav", "audio", 460, 2_712, 7],
  ["ast_v3q1a7", "prj_8f2kq1", "fld_e6p3r9", "EP105_subtitles_en.srt", "document", 1, null, 9],
  ["ast_w8r5b4", "prj_8f2kq1", "fld_e6p3r9", "EP105_offline_v1.mp4", "video", 3_200, 2_655, 11],
  ["ast_x2s7c9", "prj_8f2kq1", "fld_f1w7s3", "Trailer_A_color.mov", "video", 4_800, 124, 5],
  ["ast_y6t2d1", "prj_8f2kq1", "fld_f1w7s3", "Trailer_A_poster.png", "image", 12, null, 20],
  ["ast_z4u8e6", "prj_8f2kq1", null, "Series_bible.pdf", "document", 8, null, 200],
  ["ast_a5v3f2", "prj_3m9xh7", "fld_g8n2t6", "EP102_final_mix.wav", "audio", 1_900, 2_830, 26],
  ["ast_b9w6g7", "prj_3m9xh7", "fld_g8n2t6", "EP102_picture_lock.mov", "video", 21_000, 2_830, 28],
  ["ast_c1x4h3", "prj_3m9xh7", "fld_h3j5u1", "Harbor_still_01.jpg", "image", 9, null, 40],
  ["ast_d7y9j5", "prj_3m9xh7", "fld_h3j5u1", "Harbor_still_02.jpg", "image", 11, null, 41],
];

const assets: Asset[] = rows.map(([id, projectId, folderId, name, kind, sizeMb, durationSec, hoursAgo]) =>
  ({ id, projectId, folderId, name, kind, sizeBytes: sizeMb * 1_000_000, durationSec, updatedAt: at(hoursAgo), archivedAt: null }));

const fields: MetadataField[] = [
  { id: "mdf_status1", name: "Review status", options: ["Draft", "In review", "Approved"], deletedAt: null },
  { id: "mdf_episode", name: "Episode", options: null, deletedAt: null },
  { id: "mdf_vendor1", name: "Vendor", options: null, deletedAt: null },
];

// Values are optional per asset; many assets deliberately have none.
const values: Library["values"] = {
  ast_q2h8v1: { mdf_status1: "In review", mdf_episode: "104", mdf_vendor1: "Lumen Post" },
  ast_r7k3w5: { mdf_status1: "Draft", mdf_episode: "104" },
  ast_t5n4y8: { mdf_status1: "Approved", mdf_episode: "104", mdf_vendor1: "Fathom Audio" },
  ast_w8r5b4: { mdf_status1: "Draft", mdf_episode: "105" },
  ast_x2s7c9: { mdf_status1: "In review", mdf_vendor1: "Lumen Post" },
  ast_b9w6g7: { mdf_status1: "Approved", mdf_episode: "102" },
};

const collections: Collection[] = [
  { id: "col_m4k9p2", name: "Delivery candidates", assetIds: ["ast_q2h8v1", "ast_t5n4y8", "ast_b9w6g7"], updatedAt: at(3) },
  { id: "col_r8t1w6", name: "Marketing picks", assetIds: ["ast_x2s7c9", "ast_y6t2d1", "ast_c1x4h3"], updatedAt: at(20) },
];

export const librarySeed: Library = {
  projects: byId(projects), folders: byId(folders), assets: byId(assets),
  fields: byId(fields), values, collections: byId(collections), favorites: ["ast_q2h8v1", "ast_a5v3f2"], recent: [],
};
