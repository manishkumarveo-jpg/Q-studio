import { NavLink } from "react-router-dom";
import { navGroups } from "./navItems";

export function NavList({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav className="nav-list" aria-label="Primary">
      {navGroups.map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-group-label" aria-hidden={collapsed || undefined}>{group.label}</p>
          <ul>
            {group.items.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <NavLink to={path} className="nav-link" onClick={onNavigate} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined}>
                  <Icon size={16} aria-hidden="true" />
                  <span className="nav-label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
