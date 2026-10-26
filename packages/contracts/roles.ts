// Shared role policy (security/authorization.md). The Worker enforces it; the web app only uses it
// to render the permission matrix and hide controls. Hidden UI is never the permission check.
export const roles = ["owner", "admin", "producer", "editor", "reviewer", "client"] as const;
export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  producer: "Producer",
  editor: "Editor/Animator",
  reviewer: "Reviewer",
  client: "Client/Approver",
};

export const permissions = {
  "workspace.configure": { label: "Workspace, security and recovery settings", roles: ["owner"] },
  "members.manage": { label: "Add members, change roles, disable, reset passwords", roles: ["owner", "admin"] },
  "owner.assign": { label: "Grant or change the Owner role", roles: ["owner"] },
  "projects.manage": { label: "Create and organize projects and metadata", roles: ["owner", "admin"] },
  "assets.manage": { label: "Manage assets, shows, episodes and review requests", roles: ["owner", "admin", "producer"] },
  "qc.assign": { label: "Assign QC work and export correction sheets", roles: ["owner", "admin", "producer"] },
  "versions.upload": { label: "Upload versions and update assigned work", roles: ["owner", "admin", "producer", "editor"] },
  "assets.view": { label: "View permitted workspace assets", roles: ["owner", "admin", "producer", "editor", "reviewer"] },
  "comments.create": { label: "Create and resolve comments and annotations", roles: ["owner", "admin", "producer", "reviewer"] },
} as const satisfies Record<string, { label: string; roles: readonly Role[] }>;
export type Permission = keyof typeof permissions;

export const can = (role: Role, permission: Permission) => (permissions[permission].roles as readonly Role[]).includes(role);

/** Whether `actor` may change a member currently holding `target`, optionally to `next`. Self-changes are refused by the caller. */
export function canManageMember(actor: Role, target: Role, next?: Role) {
  if (!can(actor, "members.manage")) return false;
  if ((target === "owner" || next === "owner") && !can(actor, "owner.assign")) return false;
  return true;
}
