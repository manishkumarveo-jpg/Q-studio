import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createApiHarness, TEST_OWNER, type ApiHarness } from "../test/apiHarness";
import { renderApp } from "../test/renderApp";

let h: ApiHarness;

/** A fresh Worker API with no owner yet; tests bootstrap or sign in as needed. */
beforeEach(() => {
  h = createApiHarness();
  vi.stubGlobal("fetch", h.fetch);
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

async function signInWithForm(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Username"), username);
  await user.type(screen.getByLabelText("Password"), password);
  await user.keyboard("{Enter}");
  return user;
}

async function createMember(username: string, role: string) {
  const res = await h.post("/api/v1/members", { username, displayName: `${username} Member`, role });
  return ((await res.json()) as { data: { temporaryPassword: string } }).data.temporaryPassword;
}

describe("Phase 05 sign-in, roles and session UI", () => {
  it("TC-E2E-001: bootstraps the owner, rejects a wrong password, signs in to the requested page and signs out", async () => {
    window.history.replaceState({}, "", "/projects");
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    expect(new URLSearchParams(window.location.search).get("next")).toBe("/projects");
    expect(screen.getByLabelText("Username")).toHaveFocus();

    await user.click(await screen.findByRole("button", { name: "Create owner account" }));
    expect(await screen.findByText(/Owner account created/)).toHaveAttribute("role", "status");
    expect(screen.queryByRole("button", { name: "Create owner account" })).not.toBeInTheDocument();

    await signInWithForm(TEST_OWNER.username, "not-the-password");
    expect(await screen.findByRole("alert")).toHaveTextContent("Username or password is incorrect.");
    expect(screen.getByLabelText("Password")).toHaveValue("");

    await user.type(screen.getByLabelText("Password"), `${TEST_OWNER.password}{Enter}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Projects" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/projects");
    expect(screen.getByRole("img", { name: "Signed in as Casey Morgan (Owner)" })).toHaveTextContent("CM");
    expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByText("Kepler Post")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("First-time setup")).not.toBeInTheDocument();
    expect((await h.fetch("/api/v1/session")).status).toBe(401);
  });

  it("redirects anonymous visitors from every protected route and ignores off-site next targets", async () => {
    await h.bootstrap();
    for (const path of ["/dashboard", "/settings", "/assets?q=hero"]) {
      window.history.replaceState({}, "", path);
      const { unmount } = render(<App />);
      expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
      expect(new URLSearchParams(window.location.search).get("next")).toBe(path);
      unmount();
    }
    window.history.replaceState({}, "", "/login?next=//evil.test/phish");
    render(<App />);
    await signInWithForm(TEST_OWNER.username, TEST_OWNER.password);
    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("fails closed with a retry when the API cannot be reached", async () => {
    await h.bootstrap();
    await h.signIn();
    h.state.offline = true;
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "QC Studio is unavailable" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).not.toBeInTheDocument();
    h.state.offline = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

  it("owner adds a member, sees the temporary password once, changes role, disables and resets", async () => {
    await h.bootstrap();
    await h.signIn();
    window.history.replaceState({}, "", "/settings");
    await renderApp();
    const user = userEvent.setup();
    const members = within(await screen.findByRole("region", { name: "Members" }));
    await members.findByRole("table", { name: "Workspace members" });
    expect(members.queryByRole("button", { name: /Disable casey/ })).not.toBeInTheDocument();

    await user.type(members.getByLabelText("Username"), "riley");
    await user.type(members.getByLabelText("Display name"), "Riley Park");
    await user.selectOptions(members.getByLabelText("Role", { selector: "select" }), "reviewer");
    await user.click(members.getByRole("button", { name: "Add member" }));
    const secret = await members.findByRole("region", { name: "Temporary password" });
    const temporary = within(secret).getByText(/^[A-Za-z0-9_-]{24}$/).textContent!;
    expect(members.getByRole("row", { name: /Riley Park/ })).toHaveTextContent("temporary password");

    await user.type(members.getByLabelText("Username"), "RILEY");
    await user.type(members.getByLabelText("Display name"), "Dup");
    await user.click(members.getByRole("button", { name: "Add member" }));
    expect(await members.findByRole("alert")).toHaveTextContent("That username is already in use.");

    await user.selectOptions(members.getByRole("combobox", { name: "Role for Riley Park" }), "producer");
    expect(await members.findByText(/Role updated\. Riley Park is signed out/)).toBeInTheDocument();
    await user.click(members.getByRole("button", { name: "Disable riley" }));
    expect(await members.findByRole("button", { name: "Enable riley" })).toBeInTheDocument();
    expect(members.getByRole("row", { name: /Riley Park/ })).toHaveTextContent("Disabled");
    expect((await h.signIn("riley", temporary)).status).toBe(401);

    await user.click(members.getByRole("button", { name: "Enable riley" }));
    await user.click(await members.findByRole("button", { name: "Reset password for riley" }));
    const reset = within(await members.findByRole("region", { name: "Temporary password" })).getByText(/^[A-Za-z0-9_-]{24}$/).textContent!;
    expect(reset).not.toBe(temporary);
    expect(members.queryByText(temporary)).not.toBeInTheDocument();

    const matrix = within(screen.getByRole("table", { name: "Permissions by role" }));
    expect(matrix.getAllByRole("columnheader").map((c) => c.textContent)).toContain("Client/Approver");
    expect(within(matrix.getByRole("row", { name: /Add members, change roles/ })).getAllByLabelText("Allowed")).toHaveLength(2);
  });

  it("forces a member with a temporary password to change it before entering the workspace", async () => {
    await h.bootstrap();
    await h.signIn();
    const temporary = await createMember("jordan", "editor");
    await h.signOut();
    window.history.replaceState({}, "", "/login");
    render(<App />);
    const user = await signInWithForm("jordan", temporary);
    expect(await screen.findByRole("heading", { level: 1, name: "Change your temporary password" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Workspace navigation" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Current password"), temporary);
    await user.type(screen.getByLabelText(/^New password/), "jordan-chosen-password");
    await user.type(screen.getByLabelText("Confirm new password"), "jordan-chosen-typo");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.getByRole("alert")).toHaveTextContent("The new passwords do not match.");

    await user.clear(screen.getByLabelText("Confirm new password"));
    await user.type(screen.getByLabelText("Confirm new password"), "jordan-chosen-password");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Signed in as jordan Member (Editor/Animator)" })).toBeInTheDocument();
  });

  it("a non-manager sees the role policy but no member controls", async () => {
    await h.bootstrap();
    await h.signIn();
    const temporary = await createMember("sam", "reviewer");
    await h.signOut();
    await h.signIn("sam", temporary);
    await h.post("/api/v1/session/password", { currentPassword: temporary, newPassword: "sam-chosen-password" });
    window.history.replaceState({}, "", "/settings");
    await renderApp();
    expect(screen.getByRole("table", { name: "Permissions by role" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Members" })).not.toBeInTheDocument();
    expect(screen.getByText(/@sam · Reviewer/)).toBeInTheDocument();
  });

  it("returns to sign-in when the session is revoked while the app is open", async () => {
    await h.bootstrap();
    await h.signIn();
    window.history.replaceState({}, "", "/settings");
    await renderApp();
    const user = userEvent.setup();
    const members = within(await screen.findByRole("region", { name: "Members" }));
    await members.findByRole("table", { name: "Workspace members" });
    await h.env.DB.prepare("UPDATE sessions SET revoked_at = 1").run();
    await user.type(members.getByLabelText("Username"), "late");
    await user.type(members.getByLabelText("Display name"), "Late");
    await user.click(members.getByRole("button", { name: "Add member" }));
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(await screen.findByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
  });
});
