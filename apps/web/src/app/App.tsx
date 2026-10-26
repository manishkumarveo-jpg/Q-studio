import { ArrowUpRight, CheckCircle2, Layers3, Palette, ShieldCheck } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { StatusState } from "../components/ui/StatusState";
import { ThemeProvider } from "./ThemeProvider";

const foundationItems = [
  [Palette, "Design tokens", "Dark/light color system, typography and semantic states."],
  [Layers3, "Composable UI", "Buttons, dialogs, status states and layout primitives."],
  [ShieldCheck, "Honest by default", "Local sample content is labelled; no cloud action is implied."],
];

function FoundationHome() {
  return (
    <AppShell>
      <section className="hero-panel">
        <div className="eyebrow"><span className="pulse-dot" /> Phase 1 · UI foundation</div>
        <div className="hero-copy">
          <p className="breadcrumb">Workspace <span>/</span> Foundation</p>
          <h1>Built for the rhythm of<br /><em>post-production.</em></h1>
          <p className="hero-description">A calm, dense foundation for review, corrections, and production decisions. This screen uses deterministic local presentation data only.</p>
        </div>
        <div className="hero-actions"><Button>Explore the foundation <ArrowUpRight size={16} /></Button><Button variant="secondary">View accessibility rules</Button></div>
        <div className="foundation-grid">
          {foundationItems.map(([Icon, title, text]) => {
            const IconComponent = Icon as typeof Palette;
            return <article className="foundation-card" key={title as string}><div className="card-icon"><IconComponent size={19} /></div><h2>{title as string}</h2><p>{text as string}</p><span className="card-link">Documented <ArrowUpRight size={14} /></span></article>;
          })}
        </div>
      </section>
      <section className="foundation-status" aria-label="Foundation status">
        <div><p className="section-label">Foundation status</p><h2>Shared primitives are ready for feature phases.</h2></div>
        <div className="status-list"><span><CheckCircle2 size={16} /> Theme persistence</span><span><CheckCircle2 size={16} /> Keyboard focus</span><span><CheckCircle2 size={16} /> Route fallback</span></div>
      </section>
    </AppShell>
  );
}

function RouteFallback() {
  return <AppShell><StatusState state="empty" title="This foundation route is not available">The requested local route has not been implemented. Return to the UI foundation instead.</StatusState><a className="button button--primary back-home" href="/">Return to foundation</a></AppShell>;
}

export function App() {
  const supportedRoute = ["/", "/dashboard"].includes(window.location.pathname);
  return <ThemeProvider>{supportedRoute ? <FoundationHome /> : <RouteFallback />}</ThemeProvider>;
}
