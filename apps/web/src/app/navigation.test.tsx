import { render, screen, within } from "@testing-library/react";
import { renderApp } from "../test/renderApp";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { DashboardPage } from "../components/dashboard/DashboardPage";
import { navItems } from "../components/navigation/navItems";

const sidebar = () => within(screen.getByRole("complementary", { name: "Workspace navigation" }));

describe("Phase 02 navigation and dashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  // Route navigation E2E (jsdom): every primary item reaches a labelled route.
  it("TC-FE-002: every navigation item reaches a labelled route with breadcrumb", async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(navItems).toHaveLength(16);
    for (const item of navItems) {
      await user.click(sidebar().getByRole("link", { name: item.label }));
      expect(window.location.pathname).toBe(item.path);
      expect(screen.getByRole("heading", { level: 1, name: item.label })).toBeInTheDocument();
      expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByText(item.label)).toHaveAttribute("aria-current", "page");
      expect(sidebar().getByRole("link", { name: item.label })).toHaveAttribute("aria-current", "page");
    }
  });

  it("breadcrumb follows router matching for mixed-case and trailing-slash paths", async () => {
    for (const url of ["/Projects", "/projects/"]) {
      window.history.replaceState({}, "", url);
      const { unmount } = await renderApp();
      expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
      expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByText("Projects")).toHaveAttribute("aria-current", "page");
      unmount();
    }
  });

  it("redirects / to the dashboard and labels all seed content as demo", async () => {
    await renderApp();
    expect(window.location.pathname).toBe("/dashboard");
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    // Header + queue + projects + activity.
    expect(screen.getAllByText("Demo data")).toHaveLength(4);
    expect(screen.getByText(/not from your workspace/i)).toBeInTheDocument();
  });

  it("placeholders state their delivery phase and offer no action", async () => {
    window.history.replaceState({}, "", "/qc");
    await renderApp();
    expect(screen.getByRole("heading", { name: "Arrives in Phase 12" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });

  it("TC-UX-001 / AC-UI-001: narrow drawer traps focus, closes on navigate and restores focus", async () => {
    const user = userEvent.setup();
    await renderApp();
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const drawer = screen.getByRole("dialog", { name: "Navigation" });
    for (let i = 0; i < 25; i += 1) {
      await user.tab();
      expect(drawer).toContainElement(document.activeElement as HTMLElement);
    }
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Activity" }));
    expect(window.location.pathname).toBe("/activity");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("TC-UX-002: collapsed sidebar keeps named links and page controls usable", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    await user.click(sidebar().getByRole("link", { name: "Projects" }));
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(screen.getByRole("button", { name: "Collapse sidebar" })).toHaveAttribute("aria-expanded", "true");
  });

  it("command menu opens with Ctrl+K, filters, and navigates on Enter", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.keyboard("{Control>}k{/Control}");
    const menu = screen.getByRole("dialog", { name: "Go to page" });
    await user.type(within(menu).getByRole("textbox", { name: "Filter pages" }), "approv");
    expect(within(within(menu).getByRole("list", { name: "Pages" })).getAllByRole("button", { name: /approv/i })).toHaveLength(1);
    await user.keyboard("{Enter}");
    expect(window.location.pathname).toBe("/approvals");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("seed failure shows an error state, not dashboard figures", async () => {
    render(<ThemeProvider><MemoryRouter><DashboardPage seed={null} /></MemoryRouter></ThemeProvider>);
    expect(screen.getByRole("heading", { name: "Dashboard data could not be loaded" })).toBeInTheDocument();
    expect(screen.queryByText("Demo data")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /needs review/i })).not.toBeInTheDocument();
  });
});
