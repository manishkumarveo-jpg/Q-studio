import { render, screen, within } from "@testing-library/react";
import { renderApp } from "../test/renderApp";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AssetList } from "../components/assets/AssetList";
import { LibraryProvider } from "../features/projects/LibraryProvider";
import { librarySeed, type Asset } from "../services/mock/librarySeed";

const assetNames = () => within(screen.getByRole("list", { name: "Assets" })).getAllByRole("button", { name: /^Details for / }).map((b) => b.textContent);
const tree = () => within(screen.getByRole("navigation", { name: "Folders" }));

describe("Phase 03 projects, folders and assets", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/projects");
  });

  it("TC-E2E-002: navigates project → nested folder and keeps IDs in URLs stable across rename", async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(screen.getByText(/not saved to a server/i)).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Northbound S1/ }));
    expect(window.location.pathname).toBe("/projects/prj_8f2kq1");
    expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByText("Projects")).toHaveAttribute("aria-current", "page");
    await user.click(tree().getByRole("link", { name: "Online conform" }));
    expect(window.location.pathname).toBe("/projects/prj_8f2kq1/folders/fld_c4e9k2");
    expect(tree().getByRole("link", { name: "Online conform" })).toHaveAttribute("aria-current", "page");
    expect(within(screen.getByRole("navigation", { name: "Folder path" })).getAllByRole("link").map((l) => l.textContent)).toEqual(["Northbound S1", "EP104", "Online conform"]);
    expect(assetNames()).toEqual(["EP104_conform_v2.mov", "EP104_conform_v3.mov", "EP104_EDL.edl"]);

    await user.click(tree().getByRole("link", { name: "EP104" }));
    await user.click(screen.getByRole("button", { name: "Rename folder" }));
    const input = within(screen.getByRole("dialog", { name: "Rename folder" })).getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "EP104 locked{Enter}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "EP104 locked" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/in this browser tab \(Demo data\)/);
    await user.click(tree().getByRole("link", { name: "Online conform" }));
    expect(window.location.pathname).toBe("/projects/prj_8f2kq1/folders/fld_c4e9k2");
    expect(assetNames()).toHaveLength(3);
  });

  it("invalid rename shows an inline error and preserves the prior name", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/projects/prj_8f2kq1/folders/fld_a71c0e");
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Rename folder" }));
    const dialog = screen.getByRole("dialog", { name: "Rename folder" });
    const input = within(dialog).getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.type(input, "ep105{Enter}");
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Another item here is already named “ep105”.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("heading", { level: 1, name: "EP104" })).toBeInTheDocument();
  });

  it("invalid folder move shows an error and keeps the tree unchanged", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/projects/prj_8f2kq1/folders/fld_a71c0e");
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Move folder" }));
    const dialog = screen.getByRole("dialog", { name: "Move folder" });
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "Destination" }), "EP104 / Audio");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("cannot move into itself");
    await user.keyboard("{Escape}");
    expect(within(screen.getByRole("navigation", { name: "Folder path" })).getAllByRole("link").map((l) => l.textContent)).toEqual(["Northbound S1", "EP104"]);
  });

  it("archive a folder hides it, restore brings back the same folder and assets", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/projects/prj_8f2kq1/folders/fld_a71c0e");
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Archive folder" }));
    expect(window.location.pathname).toBe("/projects/prj_8f2kq1");
    expect(tree().queryByRole("link", { name: "EP104" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Archived 1 item in this browser tab (Demo data)");

    await user.click(within(screen.getByRole("complementary", { name: "Workspace navigation" })).getByRole("link", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Restore EP104" }));
    expect(screen.getByRole("heading", { name: "Archive is empty" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("complementary", { name: "Workspace navigation" })).getByRole("link", { name: "Projects" }));
    await user.click(screen.getByRole("link", { name: /Northbound S1/ }));
    await user.click(tree().getByRole("link", { name: "Online conform" }));
    expect(window.location.pathname).toBe("/projects/prj_8f2kq1/folders/fld_c4e9k2");
    expect(assetNames()).toHaveLength(3);
  });

  it("TC-FE-007: bulk select, move and archive assets; details panel shows a stable ID", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/projects/prj_8f2kq1/folders/fld_c4e9k2");
    await renderApp();
    await user.click(screen.getByRole("checkbox", { name: "Select EP104_conform_v2.mov" }));
    await user.click(screen.getByRole("checkbox", { name: "Select EP104_EDL.edl" }));
    const bulk = within(screen.getByRole("region", { name: "Bulk actions" }));
    expect(bulk.getByText("2 selected")).toBeInTheDocument();
    await user.click(bulk.getByRole("button", { name: "Move selected" }));
    const dialog = screen.getByRole("dialog", { name: "Move selected" });
    await user.selectOptions(within(dialog).getByRole("combobox", { name: "Destination" }), "EP105");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(assetNames()).toEqual(["EP104_conform_v3.mov"]);
    expect(screen.queryByRole("region", { name: "Bulk actions" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Details for EP104_conform_v3.mov" }));
    const details = within(screen.getByRole("complementary", { name: "Asset details" }));
    expect(details.getByText("ast_q2h8v1")).toBeInTheDocument();
    expect(details.getByText("Northbound S1 / EP104 / Online conform")).toBeInTheDocument();
    await user.click(details.getByRole("button", { name: "Archive asset" }));
    expect(screen.getByRole("heading", { name: "No assets here" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "browse all assets" })).toHaveAttribute("href", "/assets");
  });

  it("TC-FE-003: empty folder shows an actionable empty state labelled with its phase", async () => {
    window.history.replaceState({}, "", "/projects/prj_5t0bz4/folders/fld_k9b4w8");
    await renderApp();
    expect(screen.getByRole("heading", { name: "No assets here" })).toBeInTheDocument();
    expect(screen.getByText(/Uploads arrive in Phase 07/)).toBeInTheDocument();
    expect(screen.getAllByText("Demo data").length).toBeGreaterThan(0);
  });

  it("unknown IDs show a not-available state rather than another workspace's data", async () => {
    window.history.replaceState({}, "", "/projects/prj_8f2kq1/folders/fld_g8n2t6");
    await renderApp();
    expect(screen.getByRole("heading", { name: "This folder is not available" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Assets" })).not.toBeInTheDocument();
  });

  it("all assets sorts by name, size and updated; list view keeps the same items", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/assets");
    await renderApp();
    expect(assetNames()).toHaveLength(Object.keys(librarySeed.assets).length);
    await user.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "size");
    expect(assetNames()[0]).toBe("EP102_picture_lock.mov");
    await user.click(screen.getByRole("button", { name: "List" }));
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    expect(assetNames()[0]).toBe("EP102_picture_lock.mov");
  });
});

describe("Phase 03 performance baseline", () => {
  const makeAssets = (n: number): Asset[] => Array.from({ length: n }, (_, i) => ({
    ...librarySeed.assets.ast_q2h8v1, id: `ast_p${String(i).padStart(5, "0")}`, name: `Perf_${i}.mov`,
  }));

  it.each([50, 200])("renders %i mock assets", (n) => {
    const start = performance.now();
    render(<LibraryProvider><MemoryRouter><AssetList assets={makeAssets(n)} projectId="prj_8f2kq1" /></MemoryRouter></LibraryProvider>);
    const ms = performance.now() - start;
    expect(assetNames()).toHaveLength(n);
    console.info(`[perf] AssetList ${n} assets: ${ms.toFixed(1)} ms (jsdom)`);
  });
});
