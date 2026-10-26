import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardSeed, type DashboardSeed } from "../../services/mock/dashboardSeed";
import { DemoBadge } from "../ui/DemoBadge";
import { StatusState } from "../ui/StatusState";

const quickActions = [
  { label: "Open review queue", to: "/needs-review" },
  { label: "Browse projects", to: "/projects" },
  { label: "QC corrections", to: "/qc" },
  { label: "Transfer queue", to: "/transfers" },
];

export function DashboardPage({ seed = dashboardSeed }: { seed?: DashboardSeed | null }) {
  if (!seed) {
    return (
      <>
        <h1 className="page-title">Dashboard</h1>
        <StatusState state="error" title="Dashboard data could not be loaded">The local demo seed is unavailable. No workspace data has been shown or changed.</StatusState>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Dashboard</h1>
        <DemoBadge />
      </div>
      <p className="page-intro">Figures below come from a deterministic local seed, not from your workspace.</p>

      <section aria-label="Summary" className="metric-grid">
        {seed.metrics.map((metric) => (
          <Link key={metric.label} to={metric.to} className="metric-card">
            <span className="metric-value">{metric.value}</span>
            <span className="metric-label">{metric.label}</span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="quick-actions" className="quick-actions">
        <h2 id="quick-actions" className="section-label">Quick actions</h2>
        <div>{quickActions.map((a) => <Link key={a.to} to={a.to} className="button button--secondary button--sm">{a.label} <ArrowUpRight size={14} /></Link>)}</div>
      </section>

      <div className="dashboard-columns">
        <section aria-labelledby="queue-heading" className="panel">
          <div className="panel-head"><h2 id="queue-heading">Your queue</h2><DemoBadge /></div>
          <ul className="row-list">
            {seed.queue.map((item) => (
              <li key={item.id}><Link to={item.to}><strong>{item.title}</strong><span>{item.project}</span><span className="state-chip">{item.state}</span></Link></li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="projects-heading" className="panel">
          <div className="panel-head"><h2 id="projects-heading">Recent projects</h2><DemoBadge /></div>
          <ul className="row-list">
            {seed.recentProjects.map((p) => (
              <li key={p.id}><Link to="/projects"><strong>{p.name}</strong><span>{p.assets} assets</span><span>{p.updated}</span></Link></li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="activity-heading" className="panel panel--wide">
          <div className="panel-head"><h2 id="activity-heading">Recent activity</h2><DemoBadge /></div>
          {seed.activity.length ? (
            <ul className="row-list">
              {seed.activity.map((a) => <li key={a.id}><p>{a.actor} {a.action} <strong>{a.target}</strong></p><span>{a.when}</span></li>)}
            </ul>
          ) : <StatusState state="empty" title="No demo activity">The local seed contains no activity entries.</StatusState>}
        </section>
      </div>
    </>
  );
}
