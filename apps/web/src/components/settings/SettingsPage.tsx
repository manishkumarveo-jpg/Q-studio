import { Check, Minus } from "lucide-react";
import { type FormEvent, useEffect, useId, useState } from "react";
import { can, canManageMember, permissions, roleLabels, roles, type Permission, type Role } from "../../../../../packages/contracts/roles";
import { api, type ApiResult, type Member } from "../../features/auth/api";
import { useAuth, useSession } from "../../features/auth/AuthProvider";
import { PasswordChangeForm } from "../auth/AuthScreens";
import { Button } from "../ui/Button";
import { StatusState } from "../ui/StatusState";

function PermissionMatrix() {
  return (
    <section className="panel settings-section" aria-labelledby="matrix-title">
      <h2 id="matrix-title">Roles and permissions</h2>
      <p className="dialog-copy">The server checks every request against this policy. Client/Approver access comes only from review links (Phase 11), never from workspace browsing.</p>
      <div className="table-scroll">
        <table className="data-table">
          <caption className="sr-only">Permissions by role</caption>
          <thead>
            <tr><th scope="col">Permission</th>{roles.map((r) => <th key={r} scope="col">{roleLabels[r]}</th>)}</tr>
          </thead>
          <tbody>
            {(Object.keys(permissions) as Permission[]).map((p) => (
              <tr key={p}>
                <th scope="row">{permissions[p].label}</th>
                {roles.map((r) => (
                  <td key={r}>{can(r, p) ? <Check size={15} aria-label="Allowed" /> : <Minus size={15} aria-label="Not allowed" className="muted-icon" />}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type Secret = { username: string; password: string };

function Members() {
  const session = useSession();
  const { refresh } = useAuth();
  const actor = session.user.role;
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [secret, setSecret] = useState<Secret | null>(null);
  const [form, setForm] = useState({ username: "", displayName: "", role: "reviewer" as Role });
  const [formError, setFormError] = useState<string | null>(null);
  const ids = { username: useId(), displayName: useId(), role: useId() };
  const grantable = roles.filter((r) => canManageMember(actor, r, r));

  // A 401 means this session was revoked elsewhere: re-check so the app returns to sign-in.
  const handled = <T,>(result: ApiResult<T>) => {
    if (!result.ok && result.status === 401) void refresh();
    return result;
  };

  const load = async () => {
    setLoadError(null);
    const result = handled(await api<{ members: Member[] }>("GET", "/members"));
    if (result.ok) setMembers(result.data.members);
    else setLoadError(result.error.message);
  };
  // Load once on mount; Try again calls load directly.
  useEffect(() => { void load(); }, []);

  const replace = (member: Member) => setMembers((list) => list?.map((m) => (m.id === member.id ? member : m)) ?? null);

  const change = async (member: Member, body: { role?: Role; status?: Member["status"] }, done: string) => {
    setActionError(null);
    setSecret(null);
    const result = handled(await api<{ member: Member }>("PATCH", `/members/${member.id}`, body));
    if (!result.ok) return setActionError(result.error.message);
    replace(result.data.member);
    setNotice(`${done} ${member.displayName} is signed out of every session.`);
  };

  const reset = async (member: Member) => {
    setActionError(null);
    const result = handled(await api<{ member: Member; temporaryPassword: string }>("POST", `/members/${member.id}/reset-password`));
    if (!result.ok) return setActionError(result.error.message);
    replace(result.data.member);
    setNotice(`Password reset for ${member.displayName}. Their sessions were signed out.`);
    setSecret({ username: member.username, password: result.data.temporaryPassword });
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const result = handled(await api<{ member: Member; temporaryPassword: string }>("POST", "/members", form));
    if (!result.ok) return setFormError(result.error.message);
    setMembers((list) => [...(list ?? []), result.data.member]);
    setForm({ username: "", displayName: "", role: form.role });
    setNotice(`Added ${result.data.member.displayName}.`);
    setSecret({ username: result.data.member.username, password: result.data.temporaryPassword });
  };

  return (
    <section className="panel settings-section" aria-labelledby="members-title">
      <h2 id="members-title">Members</h2>
      <p className="notice" role="status">{notice}</p>
      {actionError && <p className="field-error" role="alert">{actionError}</p>}
      {secret && (
        <div className="secret-box" role="region" aria-label="Temporary password">
          <p className="dialog-copy">Temporary password for <strong>{secret.username}</strong>. Copy it now and share it outside QC Studio (in person or a password manager). It is not shown again and must be changed at first sign-in.</p>
          <code>{secret.password}</code>
          <Button variant="ghost" size="sm" onClick={() => setSecret(null)}>Done</Button>
        </div>
      )}
      {loadError && (
        <>
          <StatusState state="error" title="Members could not be loaded">{loadError}</StatusState>
          <Button className="back-home" variant="secondary" size="sm" onClick={() => void load()}>Try again</Button>
        </>
      )}
      {!members && !loadError && <StatusState state="loading" title="Loading members">Fetching the member list.</StatusState>}
      {members && (
        <div className="table-scroll">
          <table className="data-table">
            <caption className="sr-only">Workspace members</caption>
            <thead><tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {members.map((m) => {
                const editable = m.id !== session.user.id && canManageMember(actor, m.role);
                return (
                  <tr key={m.id}>
                    <th scope="row">{m.displayName} <span className="muted">@{m.username}{m.id === session.user.id ? " (you)" : ""}</span></th>
                    <td>
                      {editable ? (
                        <select className="select" aria-label={`Role for ${m.displayName}`} value={m.role} onChange={(e) => void change(m, { role: e.target.value as Role }, "Role updated.")}>
                          {roles.filter((r) => r === m.role || canManageMember(actor, m.role, r)).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                        </select>
                      ) : roleLabels[m.role]}
                    </td>
                    <td>{m.status === "active" ? "Active" : "Disabled"}{m.mustChangePassword ? " · temporary password" : ""}</td>
                    <td className="row-actions">
                      {editable && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => void change(m, { status: m.status === "active" ? "disabled" : "active" }, m.status === "active" ? "Disabled." : "Enabled.")}>
                            {m.status === "active" ? `Disable ${m.username}` : `Enable ${m.username}`}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => void reset(m)}>Reset password for {m.username}</Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <form className="dialog-form member-form" onSubmit={add} noValidate aria-labelledby="add-member-title">
        <h3 id="add-member-title">Add member</h3>
        <label className="field-label" htmlFor={ids.username}>Username</label>
        <input id={ids.username} className="command-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
        <label className="field-label" htmlFor={ids.displayName}>Display name</label>
        <input id={ids.displayName} className="command-input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} autoComplete="off" />
        <label className="field-label" htmlFor={ids.role}>Role</label>
        <select id={ids.role} className="command-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
          {grantable.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
        </select>
        {formError && <p className="field-error" role="alert">{formError}</p>}
        <div className="dialog-actions"><Button type="submit">Add member</Button></div>
      </form>
    </section>
  );
}

export function SettingsPage() {
  const session = useSession();
  const { setSession } = useAuth();
  const [changed, setChanged] = useState("");
  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-intro">Your account, workspace members and the role policy for {session.workspace.name}.</p>
      <div className="settings-grid">
        <section className="panel settings-section" aria-labelledby="account-title">
          <h2 id="account-title">Your account</h2>
          <p className="dialog-copy">{session.user.displayName} · @{session.user.username} · {roleLabels[session.user.role]}</p>
          <p className="notice" role="status">{changed}</p>
          <PasswordChangeForm onChanged={(s) => { setSession(s); setChanged("Password changed. Your other sessions were signed out."); }} />
        </section>
        {can(session.user.role, "members.manage") && <Members />}
        <PermissionMatrix />
      </div>
    </>
  );
}
