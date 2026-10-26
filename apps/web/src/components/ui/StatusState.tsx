import { AlertCircle, CircleAlert, LoaderCircle, Sparkles } from "lucide-react";
import { type ReactNode } from "react";

type State = "empty" | "loading" | "error" | "info";

const icons = { empty: Sparkles, loading: LoaderCircle, error: AlertCircle, info: CircleAlert };

export function StatusState({ state, title, children }: { state: State; title: string; children: ReactNode }) {
  const Icon = icons[state];
  return (
    <section className={`status-state status-state--${state}`} aria-live={state === "loading" ? "polite" : undefined}>
      <Icon size={22} aria-hidden="true" className={state === "loading" ? "spin" : undefined} />
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
