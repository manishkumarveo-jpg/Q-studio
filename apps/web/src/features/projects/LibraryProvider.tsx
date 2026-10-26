import { createContext, type ReactNode, useContext, useState } from "react";
import { librarySeed, type Library } from "../../services/mock/librarySeed";
import type { Result } from "./library";

// Local, in-memory demo store. It is not persisted and is never sent to a server.
type LibraryContext = {
  library: Library;
  /** Applies a pure operation; returns the error message or null on success. */
  apply: (operation: (library: Library) => Result) => string | null;
  notice: string;
  setNotice: (notice: string) => void;
};

const Context = createContext<LibraryContext | null>(null);

export function LibraryProvider({ children, initial = librarySeed }: { children: ReactNode; initial?: Library }) {
  const [library, setLibrary] = useState(initial);
  const [notice, setNotice] = useState("");
  const apply: LibraryContext["apply"] = (operation) => {
    const result = operation(library);
    if (!result.ok) return result.error;
    setLibrary(result.library);
    return null;
  };
  return <Context.Provider value={{ library, apply, notice, setNotice }}>{children}</Context.Provider>;
}

export function useLibrary() {
  const value = useContext(Context);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
