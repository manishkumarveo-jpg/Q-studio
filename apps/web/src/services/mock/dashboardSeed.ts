// Deterministic demo seed. Nothing here comes from a server; the UI must label it as Demo data.
export type DashboardSeed = {
  metrics: { label: string; value: number; to: string }[];
  queue: { id: string; title: string; project: string; state: string; to: string }[];
  recentProjects: { id: string; name: string; assets: number; updated: string }[];
  activity: { id: string; actor: string; action: string; target: string; when: string }[];
};

export const dashboardSeed: DashboardSeed = {
  metrics: [
    { label: "Needs review", value: 7, to: "/needs-review" },
    { label: "Assigned to me", value: 4, to: "/assigned" },
    { label: "Pending approvals", value: 2, to: "/approvals" },
    { label: "Open QC corrections", value: 18, to: "/qc" },
  ],
  queue: [
    { id: "q1", title: "EP104 — Online conform v3", project: "Northbound S1", state: "Needs review", to: "/needs-review" },
    { id: "q2", title: "Trailer A — Color pass", project: "Northbound S1", state: "Assigned", to: "/assigned" },
    { id: "q3", title: "EP102 — Final mix", project: "Harbor Lights", state: "Approval", to: "/approvals" },
    { id: "q4", title: "EP105 — Subtitle QC", project: "Northbound S1", state: "QC", to: "/qc" },
  ],
  recentProjects: [
    { id: "p1", name: "Northbound S1", assets: 142, updated: "Demo · 2h ago" },
    { id: "p2", name: "Harbor Lights", assets: 67, updated: "Demo · yesterday" },
    { id: "p3", name: "Brand Spots Q4", assets: 23, updated: "Demo · 3 days ago" },
  ],
  activity: [
    { id: "a1", actor: "Demo editor", action: "uploaded version 3 of", target: "EP104 — Online conform", when: "Demo · 2h ago" },
    { id: "a2", actor: "Demo reviewer", action: "left 6 comments on", target: "Trailer A — Color pass", when: "Demo · 5h ago" },
    { id: "a3", actor: "Demo producer", action: "requested approval for", target: "EP102 — Final mix", when: "Demo · yesterday" },
  ],
};
