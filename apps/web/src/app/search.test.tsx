import { screen, within } from "@testing-library/react";
import { renderApp } from "../test/renderApp";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SAVED_FILTERS_KEY, SAVED_MAX } from "../lib/local-storage/preferences";

const assetNames = () => within(screen.getByRole("list", { name: "Assets" })).getAllByRole("button", { name: /^Details for / }).map((b) => b.textContent);
const sidebar = () => within(screen.getByRole("complementary", { name: "Workspace navigation" }));
const details = () => within(screen.getByRole("complementary", { name: "Asset details" }));
const search = () => within(screen.getByRole("search", { name: "Asset search" }));

describe("Phase 04 search, metadata and collections", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/assets");
  });

  it("TC-FE-006: combined filters narrow results, sync to the URL and clear", async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(screen.getAllByText("Demo data").length).toBeGreaterThan(0);
    await user.selectOptions(search().getByRole("combobox", { name: "Type" }), "video");
    await user.selectOptions(search().getByRole("combobox", { name: "Field" }), "Review status");
    await user.selectOptions(search().getByRole("combobox", { name: "Value" }), "In review");
    expect(assetNames()).toEqual(["EP104_conform_v3.mov", "Trailer_A_color.mov"]);
    expect(new URLSearchParams(window.location.search).get("field")).toBe("mdf_status1");
    await user.type(search().getByRole("searchbox", { name: "Search assets" }), "lumen trailer");
    expect(assetNames()).toEqual(["Trailer_A_color.mov"]);
    await user.selectOptions(search().getByRole("combobox", { name: "Project" }), "Harbor Lights");
    expect(screen.getByRole("heading", { name: "No assets match these filters" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(window.location.search).toBe("");
    expect(assetNames()).toHaveLength(14);
  });

  it("a stale saved query (deleted field) shows an error with a recovery action", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Details for EP104_conform_v3.mov" }));
    await user.click(screen.getByRole("button", { name: "Metadata fields" }));
    await user.click(screen.getByRole("button", { name: "Delete field Vendor" }));
    await user.keyboard("{Escape}");
    // Historical value stays readable on the asset.
    expect(details().getByText("Vendor (deleted field)")).toBeInTheDocument();
    expect(details().getByText("Lumen Post")).toBeInTheDocument();
    expect(search().queryByRole("option", { name: "Vendor" })).not.toBeInTheDocument();

    window.history.pushState({}, "", "/assets?field=mdf_vendor1");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(await screen.findByRole("heading", { name: "This search cannot run" })).toBeInTheDocument();
    expect(screen.getByText(/metadata field was deleted/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(assetNames()).toHaveLength(14);
  });

  it("metadata edits render markup as text and become searchable", async () => {
    const user = userEvent.setup();
    const { container } = await renderApp();
    await user.click(screen.getByRole("button", { name: "Details for Harbor_still_01.jpg" }));
    await user.click(details().getByRole("button", { name: "Edit metadata" }));
    const dialog = within(screen.getByRole("dialog", { name: "Edit metadata" }));
    await user.type(dialog.getByRole("textbox", { name: "Vendor" }), "<img src=x onerror=alert(1)>");
    await user.selectOptions(dialog.getByRole("combobox", { name: "Review status" }), "Approved");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(details().getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/Saved metadata in this browser tab \(Demo data\)/)).toBeInTheDocument();
    await user.type(search().getByRole("searchbox", { name: "Search assets" }), "onerror");
    expect(assetNames()).toEqual(["Harbor_still_01.jpg"]);
  });

  it("collections reference assets: adding twice does not duplicate and All Assets count is unchanged", async () => {
    const user = userEvent.setup();
    await renderApp();
    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByRole("button", { name: "Details for EP104_EDL.edl" }));
      await user.click(details().getByRole("button", { name: "Add to collection" }));
      const dialog = within(screen.getByRole("dialog", { name: "Add to collection" }));
      await user.selectOptions(dialog.getByRole("combobox", { name: "Collection" }), "Marketing picks");
      await user.click(dialog.getByRole("button", { name: "Save" }));
    }
    expect(screen.getByText(/referenced, not copied/)).toBeInTheDocument();
    expect(assetNames()).toHaveLength(14);

    await user.click(sidebar().getByRole("link", { name: "Collections" }));
    expect(screen.getByRole("link", { name: /Marketing picks/ })).toHaveTextContent("4 assets");
    await user.click(screen.getByRole("link", { name: /Marketing picks/ }));
    expect(window.location.pathname).toBe("/collections/col_r8t1w6");
    expect(assetNames()).toEqual(["EP104_EDL.edl", "Harbor_still_01.jpg", "Trailer_A_color.mov", "Trailer_A_poster.png"]);
    await user.click(screen.getByRole("button", { name: "Details for EP104_EDL.edl" }));
    await user.click(details().getByRole("button", { name: "Remove from collection" }));
    expect(assetNames()).toHaveLength(3);
    await user.click(sidebar().getByRole("link", { name: "All Assets" }));
    expect(assetNames()).toContain("EP104_EDL.edl");
  });

  it("creates a collection with validation", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/collections");
    await renderApp();
    await user.click(screen.getByRole("button", { name: "New collection" }));
    const dialog = within(screen.getByRole("dialog", { name: "New collection" }));
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "delivery CANDIDATES{Enter}");
    expect(dialog.getByRole("alert")).toHaveTextContent("already exists");
    await user.clear(dialog.getByRole("textbox", { name: "Name" }));
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "Promo{Enter}");
    await user.click(screen.getByRole("link", { name: /Promo/ }));
    expect(screen.getByRole("heading", { name: "This collection is empty" })).toBeInTheDocument();
  });

  it("saves a filter locally, survives remount, and deletes it", async () => {
    const user = userEvent.setup();
    const { unmount } = await renderApp();
    await user.click(screen.getByRole("button", { name: "Save filter" }));
    await user.type(within(screen.getByRole("dialog", { name: "Save filter" })).getByRole("textbox", { name: "Filter name" }), "Nothing{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("Set at least one filter first.");
    await user.keyboard("{Escape}");

    await user.selectOptions(search().getByRole("combobox", { name: "Type" }), "audio");
    await user.click(screen.getByRole("button", { name: "Save filter" }));
    expect(screen.getByText(/Saved filters stay in this browser/)).toBeInTheDocument();
    await user.type(within(screen.getByRole("dialog", { name: "Save filter" })).getByRole("textbox", { name: "Filter name" }), "Audio only{Enter}");
    expect(JSON.parse(window.localStorage.getItem(SAVED_FILTERS_KEY) ?? "[]")).toMatchObject([{ name: "Audio only", params: "kind=audio" }]);
    unmount();

    window.history.replaceState({}, "", "/assets");
    await renderApp();
    await user.click(screen.getByRole("link", { name: "Audio only" }));
    expect(assetNames()).toEqual(["EP102_final_mix.wav", "EP104_mix_ref.wav", "EP104_stems.wav"]);
    await user.click(screen.getByRole("button", { name: "Delete saved filter Audio only" }));
    expect(screen.queryByRole("link", { name: "Audio only" })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(SAVED_FILTERS_KEY)).toBe("[]");
  });

  it("refuses a saved filter past the limit instead of showing one that was not stored", async () => {
    const user = userEvent.setup();
    const full = Array.from({ length: SAVED_MAX }, (_, i) => ({ id: `flt_${i}`, name: `F${i}`, params: "kind=audio" }));
    window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(full));
    window.history.replaceState({}, "", "/assets?kind=video");
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Save filter" }));
    await user.type(within(screen.getByRole("dialog", { name: "Save filter" })).getByRole("textbox", { name: "Filter name" }), "One more{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent(`up to ${SAVED_MAX} saved filters`);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: "One more" })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(SAVED_FILTERS_KEY) ?? "[]")).toHaveLength(SAVED_MAX);
  });

  it("favorites and recent reflect details-panel actions; view preference persists", async () => {
    const user = userEvent.setup();
    const { unmount } = await renderApp();
    await user.click(screen.getByRole("button", { name: "List" }));
    await user.click(screen.getByRole("button", { name: "Details for Harbor_still_02.jpg" }));
    await user.click(details().getByRole("button", { name: "Favorite" }));
    expect(details().getByRole("button", { name: "Favorited" })).toHaveAttribute("aria-pressed", "true");
    await user.click(sidebar().getByRole("link", { name: "Favorites" }));
    expect(assetNames()).toEqual(["EP102_final_mix.wav", "EP104_conform_v3.mov", "Harbor_still_02.jpg"]);
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    await user.click(sidebar().getByRole("link", { name: "Recent" }));
    expect(assetNames()).toEqual(["Harbor_still_02.jpg"]);
    unmount();
    window.history.replaceState({}, "", "/recent");
    await renderApp();
    expect(screen.getByRole("heading", { name: "Nothing opened yet" })).toBeInTheDocument();
  });

  it("⌘K finds an asset by metadata and opens its details", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/dashboard");
    await renderApp();
    await user.keyboard("{Control>}k{/Control}");
    const menu = within(screen.getByRole("dialog", { name: "Go to page" }));
    await user.type(menu.getByRole("textbox", { name: "Filter pages" }), "fathom");
    await user.click(within(menu.getByRole("list", { name: "Assets (Demo data)" })).getByRole("button", { name: "EP104_stems.wav" }));
    expect(window.location.pathname).toBe("/assets");
    expect(assetNames()).toEqual(["EP104_stems.wav"]);
    expect(details().getByText("ast_t5n4y8")).toBeInTheDocument();
  });
});
