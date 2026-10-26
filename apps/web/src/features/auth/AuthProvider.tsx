import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { api, type SessionData } from "./api";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "error"; message: string }
  | { status: "signed-in"; session: SessionData };

type AuthContext = {
  state: AuthState;
  refresh: () => Promise<void>;
  setSession: (session: SessionData | null) => void;
  /** Returns an error message, or null once the server has revoked the session. */
  signOut: () => Promise<string | null>;
};

const Context = createContext<AuthContext | null>(null);

// The server is the only source of truth: this state only decides which screen to render.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    const result = await api<SessionData>("GET", "/session");
    if (result.ok) setState({ status: "signed-in", session: result.data });
    else if (result.status === 401) setState({ status: "anonymous" });
    else setState({ status: "error", message: result.error.message });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setSession = useCallback((session: SessionData | null) => setState(session ? { status: "signed-in", session } : { status: "anonymous" }), []);

  const signOut = useCallback(async () => {
    const result = await api("DELETE", "/session");
    if (!result.ok) return result.error.message;
    setState({ status: "anonymous" });
    return null;
  }, []);

  return <Context.Provider value={{ state, refresh, setSession, signOut }}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

/** For screens rendered behind RequireAuth. */
export function useSession() {
  const { state } = useAuth();
  if (state.status !== "signed-in") throw new Error("useSession requires a signed-in session");
  return state.session;
}
