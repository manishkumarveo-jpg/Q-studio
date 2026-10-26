import { fireEvent, screen } from "@testing-library/react";
import { renderApp } from "../test/renderApp";
import { beforeEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "../lib/local-storage/theme";

// Phase 01 regression: TC-FE-001 theme persistence and route fallback.
describe("QC Studio foundation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("persists the selected theme", async () => {
    await renderApp();
    fireEvent.click(screen.getByLabelText("Switch to light theme"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("renders an honest fallback for unknown routes", async () => {
    window.history.replaceState({}, "", "/not-a-route");
    await renderApp();
    expect(screen.getByRole("heading", { name: "This route is not available" })).toBeInTheDocument();
    expect(screen.getByText(/has not been implemented/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to dashboard" })).toHaveAttribute("href", "/dashboard");
  });
});
