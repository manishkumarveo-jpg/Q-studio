import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { THEME_STORAGE_KEY } from "../lib/local-storage/theme";

describe("QC Studio foundation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("persists the selected theme", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Switch to light theme"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("renders an honest fallback for unknown routes", () => {
    window.history.replaceState({}, "", "/not-a-route");
    render(<App />);
    expect(screen.getByRole("heading", { name: "This foundation route is not available" })).toBeInTheDocument();
    expect(screen.getByText(/has not been implemented/i)).toBeInTheDocument();
  });
});
