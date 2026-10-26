import { render, screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { App } from "../app/App";

/** Renders the app and waits until the session check and any redirect have produced a page heading. */
export async function renderApp() {
  const result = render(<App />);
  await waitFor(() => expect(screen.getByRole("main").querySelector("h1, h2")).not.toBeNull());
  return result;
}
