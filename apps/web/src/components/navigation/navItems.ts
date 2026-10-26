import {
  Activity, Archive, ArrowDownUp, BadgeCheck, Clock, Eye, Files, FolderKanban, Inbox, LayoutDashboard,
  Library, ListChecks, Settings, Share2, Star, UserCheck, type LucideIcon,
} from "lucide-react";

export type NavItem = { path: string; label: string; icon: LucideIcon; phase: string; summary: string };

// Grouped primary IA from ux/information-architecture.md. `phase` names where the real feature lands.
export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, phase: "02", summary: "Summary of work across the workspace." },
      { path: "/projects", label: "Projects", icon: FolderKanban, phase: "03", summary: "Projects, folders and their assets." },
      { path: "/assets", label: "All Assets", icon: Files, phase: "03", summary: "Every asset you can access, across projects." },
      { path: "/recent", label: "Recent", icon: Clock, phase: "04", summary: "Assets and projects you opened recently." },
      { path: "/favorites", label: "Favorites", icon: Star, phase: "04", summary: "Items you starred for quick access." },
      { path: "/collections", label: "Collections", icon: Library, phase: "04", summary: "Named groups that reference assets without copying them." },
    ],
  },
  {
    label: "Review",
    items: [
      { path: "/shared-with-me", label: "Shared with Me", icon: Inbox, phase: "11", summary: "Work other members shared with you." },
      { path: "/shares", label: "Shares", icon: Share2, phase: "11", summary: "Review links you created and their access state." },
      { path: "/assigned", label: "Assigned to Me", icon: UserCheck, phase: "09", summary: "Comments and tasks assigned to you." },
      { path: "/needs-review", label: "Needs Review", icon: Eye, phase: "09", summary: "Versions waiting on review feedback." },
      { path: "/approvals", label: "Pending Approvals", icon: BadgeCheck, phase: "11", summary: "Approval requests awaiting a decision." },
      { path: "/qc", label: "QC Corrections", icon: ListChecks, phase: "12", summary: "Show and episode correction lists." },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/transfers", label: "Transfer Queue", icon: ArrowDownUp, phase: "07", summary: "Uploads and downloads in progress." },
      { path: "/activity", label: "Activity", icon: Activity, phase: "15", summary: "Workspace events and notifications." },
      { path: "/archive", label: "Archive", icon: Archive, phase: "03", summary: "Archived projects and assets." },
      { path: "/settings", label: "Settings", icon: Settings, phase: "05", summary: "Workspace, member and role settings." },
    ],
  },
];

export const navItems = navGroups.flatMap((group) => group.items);
