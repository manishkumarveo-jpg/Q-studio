import { type FormEvent, type ReactNode, useEffect, useId, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api, safeNext, type SessionData } from "../../features/auth/api";
import { useAuth } from "../../features/auth/AuthProvider";
import { Button } from "../ui/Button";
import { StatusState } from "../ui/StatusState";

function Field({ label, type = "text", value, onChange, autoComplete, autoFocus }: {
  label: string; type?: string; value: string; onChange: (value: string) => void; autoComplete: string; autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} className="command-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} autoFocus={autoFocus} required />
    </>
  );
}

function AuthCard({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <main className="auth-screen" id="main">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand"><span>QC</span><strong>Studio</strong></div>
        <h1 className="page-title" id="auth-title">{title}</h1>
        <p className="page-intro">{intro}</p>
        {children}
      </section>
    </main>
  );
}

/** Gate for every workspace route. Rendering is not authorization: the API checks each request. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state, refresh } = useAuth();
  const location = useLocation();
  if (state.status === "loading") {
    return <div className="auth-screen"><StatusState state="loading" title="Checking your session">One moment while QC Studio confirms you are signed in.</StatusState></div>;
  }
  if (state.status === "error") {
    return (
      <div className="auth-screen">
        <StatusState state="error" title="QC Studio is unavailable">{state.message}</StatusState>
        <Button className="back-home" onClick={() => void refresh()}>Try again</Button>
      </div>
    );
  }
  if (state.status === "anonymous") return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (state.session.user.mustChangePassword) return <ForcedPasswordChange />;
  return children;
}

function BootstrapPanel() {
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let live = true;
    void api<{ available: boolean }>("GET", "/bootstrap").then((r) => live && r.ok && setAvailable(r.data.available));
    return () => { live = false; };
  }, []);
  if (!available && !message) return null;
  const run = async () => {
    setPending(true);
    const result = await api("POST", "/bootstrap");
    setPending(false);
    if (result.ok) {
      setAvailable(false);
      setMessage({ text: "Owner account created. Sign in with the username and password the operator configured.", error: false });
    } else setMessage({ text: result.error.message, error: true });
  };
  return (
    <section className="auth-bootstrap" aria-labelledby="bootstrap-title">
      <h2 id="bootstrap-title">First-time setup</h2>
      {available && (
        <>
          <p className="dialog-copy">No owner exists yet. Setup creates the owner account from the deployment secrets the operator set. It runs once, and nothing you type is used.</p>
          <Button variant="secondary" size="sm" onClick={() => void run()} disabled={pending}>{pending ? "Creating owner…" : "Create owner account"}</Button>
        </>
      )}
      {message && <p className={message.error ? "field-error" : "dialog-copy"} role={message.error ? "alert" : "status"}>{message.text}</p>}
    </section>
  );
}

export function LoginPage() {
  const { state, setSession } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (state.status === "signed-in") return <Navigate to={next} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await api<SessionData>("POST", "/session", { username, password });
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      setPassword("");
      return;
    }
    setSession(result.data);
    navigate(next, { replace: true });
  };

  return (
    <AuthCard title="Sign in" intro="Use the account your workspace owner or admin gave you. There is no public sign-up.">
      <form className="dialog-form" onSubmit={submit} noValidate aria-busy={pending}>
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" autoFocus />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="dialog-actions"><Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button></div>
      </form>
      <BootstrapPanel />
    </AuthCard>
  );
}

export function PasswordChangeForm({ onChanged }: { onChanged: (session: SessionData) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) return setError("The new passwords do not match.");
    setPending(true);
    setError(null);
    const result = await api<SessionData>("POST", "/session/password", { currentPassword: current, newPassword: next });
    setPending(false);
    if (!result.ok) return setError(result.error.message);
    setCurrent(""); setNext(""); setConfirm("");
    onChanged(result.data);
  };
  return (
    <form className="dialog-form" onSubmit={submit} noValidate aria-busy={pending}>
      <Field label="Current password" type="password" value={current} onChange={setCurrent} autoComplete="current-password" />
      <Field label="New password (at least 12 characters)" type="password" value={next} onChange={setNext} autoComplete="new-password" />
      <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="dialog-actions"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Change password"}</Button></div>
    </form>
  );
}

function ForcedPasswordChange() {
  const { setSession, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthCard title="Change your temporary password" intro="Your admin issued a temporary password. Choose your own before you continue; other sessions will be signed out.">
      <PasswordChangeForm onChanged={setSession} />
      <Button variant="ghost" size="sm" onClick={async () => setError(await signOut())}>Sign out</Button>
      {error && <p className="field-error" role="alert">{error}</p>}
    </AuthCard>
  );
}
