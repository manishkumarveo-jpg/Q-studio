import { Folder as FolderIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { folderPath, isAssetVisible, isFolderHidden, setArchived, type EntityKind } from "../../features/projects/library";
import { useLibrary } from "../../features/projects/LibraryProvider";
import type { Library, Project } from "../../services/mock/librarySeed";
import { AssetList } from "../assets/AssetList";
import { Button } from "../ui/Button";
import { DemoBadge } from "../ui/DemoBadge";
import { StatusState } from "../ui/StatusState";
import { ArchiveAction, MoveAction, Notice, RenameAction } from "./EntityActions";

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true });
const projectUrl = (projectId: string, folderId?: string | null) => `/projects/${projectId}${folderId ? `/folders/${folderId}` : ""}`;

export function Head({ title }: { title: string }) {
  return (
    <>
      <div className="page-head"><h1 className="page-title">{title}</h1><DemoBadge /></div>
      <p className="page-intro">Demo data from a local seed. Changes stay in this browser tab and are not saved to a server.</p>
      <Notice />
    </>
  );
}

const visibleAssets = (library: Library) => Object.values(library.assets).filter((a) => isAssetVisible(library, a));

export function ProjectsPage() {
  const { library } = useLibrary();
  const projects = Object.values(library.projects).filter((p) => !p.archivedAt).sort(byName);
  const assets = visibleAssets(library);
  return (
    <>
      <Head title="Projects" />
      {projects.length ? (
        <ul className="project-grid" aria-label="Projects">
          {projects.map((p) => (
            <li key={p.id}>
              <Link className="metric-card" to={projectUrl(p.id)}>
                <strong>{p.name}</strong>
                <span className="metric-label">{assets.filter((a) => a.projectId === p.id).length} assets</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <StatusState state="empty" title="No active projects">Restore a project from <Link to="/archive">Archive</Link>. Creating projects arrives with the API in Phase 06.</StatusState>
      )}
    </>
  );
}

function FolderTree({ project, activeId }: { project: Project; activeId?: string }) {
  const { library } = useLibrary();
  const level = (parentId: string | null) => {
    const children = Object.values(library.folders).filter((f) => f.projectId === project.id && f.parentId === parentId && !f.archivedAt).sort(byName);
    return children.length ? (
      <ul>
        {children.map((f) => (
          <li key={f.id}>
            <Link className="tree-link" to={projectUrl(project.id, f.id)} aria-current={f.id === activeId ? "page" : undefined}><FolderIcon size={14} aria-hidden="true" />{f.name}</Link>
            {level(f.id)}
          </li>
        ))}
      </ul>
    ) : null;
  };
  return (
    <nav className="folder-tree panel" aria-label="Folders">
      <Link className="tree-link" to={projectUrl(project.id)} aria-current={activeId ? undefined : "page"}>{project.name}</Link>
      {level(null)}
    </nav>
  );
}

export function ProjectBrowser() {
  const { projectId = "", folderId } = useParams();
  const { library } = useLibrary();
  const navigate = useNavigate();
  const project = library.projects[projectId];
  const folder = folderId ? library.folders[folderId] : undefined;

  if (!project || (folderId && folder?.projectId !== projectId)) {
    return <StatusState state="empty" title="This folder is not available">It does not exist in this demo library. <Link to="/projects">Back to projects</Link>.</StatusState>;
  }
  if (project.archivedAt || (folderId && isFolderHidden(library, folderId))) {
    return <StatusState state="empty" title="This item is archived">Restore it from <Link to="/archive">Archive</Link> to browse it.</StatusState>;
  }

  const path = folderPath(library, folderId ?? null);
  const assets = Object.values(library.assets).filter((a) => a.projectId === projectId && a.folderId === (folderId ?? null) && !a.archivedAt);
  return (
    <div className="browser">
      <FolderTree project={project} activeId={folderId} />
      <div className="browser-main">
        <nav aria-label="Folder path" className="breadcrumb">
          <ol>
            <li><Link to={projectUrl(projectId)}>{project.name}</Link></li>
            {path.map((f) => <li key={f.id}><Link to={projectUrl(projectId, f.id)}>{f.name}</Link></li>)}
          </ol>
        </nav>
        <Head title={folder?.name ?? project.name} />
        <div className="toolbar">
          {folder ? (
            <>
              <RenameAction key={folder.id} kind="folder" id={folder.id} name={folder.name} />
              <MoveAction kind="folder" ids={[folder.id]} projectId={projectId} label="Move folder" />
              <ArchiveAction kind="folder" ids={[folder.id]} label="Archive folder" onDone={() => navigate(projectUrl(projectId, folder.parentId))} />
            </>
          ) : (
            <>
              <RenameAction key={project.id} kind="project" id={project.id} name={project.name} />
              <ArchiveAction kind="project" ids={[project.id]} label="Archive project" onDone={() => navigate("/projects")} />
            </>
          )}
        </div>
        <AssetList key={folderId ?? projectId} assets={assets} projectId={projectId} />
      </div>
    </div>
  );
}

export function ArchivePage() {
  const { library, apply, setNotice } = useLibrary();
  const groups: { kind: EntityKind; title: string; items: { id: string; name: string; where: string; parentHidden: boolean }[] }[] = [
    { kind: "project", title: "Projects", items: Object.values(library.projects).filter((p) => p.archivedAt).map((p) => ({ id: p.id, name: p.name, where: "Workspace", parentHidden: false })) },
    { kind: "folder", title: "Folders", items: Object.values(library.folders).filter((f) => f.archivedAt).map((f) => ({ id: f.id, name: f.name, where: [library.projects[f.projectId]?.name, ...folderPath(library, f.parentId).map((p) => p.name)].join(" / "), parentHidden: !!library.projects[f.projectId]?.archivedAt || isFolderHidden(library, f.parentId) })) },
    { kind: "asset", title: "Assets", items: Object.values(library.assets).filter((a) => a.archivedAt).map((a) => ({ id: a.id, name: a.name, where: [library.projects[a.projectId]?.name, ...folderPath(library, a.folderId).map((p) => p.name)].join(" / "), parentHidden: !!library.projects[a.projectId]?.archivedAt || isFolderHidden(library, a.folderId) })) },
  ];
  const restore = (kind: EntityKind, item: { id: string; name: string; parentHidden: boolean }) => {
    const failure = apply((l) => setArchived(l, kind, [item.id], false));
    setNotice(failure ?? `Restored “${item.name}” in this browser tab (Demo data).${item.parentHidden ? " It stays hidden until its archived parent is restored." : ""}`);
  };
  const nonEmpty = groups.filter((g) => g.items.length);
  return (
    <>
      <Head title="Archive" />
      {nonEmpty.length ? nonEmpty.map((g) => (
        <section key={g.kind} className="panel archive-group" aria-labelledby={`archive-${g.kind}`}>
          <h2 id={`archive-${g.kind}`} className="section-label">{g.title}</h2>
          <ul className="row-list">
            {g.items.sort(byName).map((item) => (
              <li key={item.id}>
                <p><strong>{item.name}</strong> · {item.where}</p>
                <Button variant="secondary" size="sm" onClick={() => restore(g.kind, item)} aria-label={`Restore ${item.name}`}>Restore</Button>
              </li>
            ))}
          </ul>
        </section>
      )) : <StatusState state="empty" title="Archive is empty">Archived projects, folders and assets appear here and can be restored. <Link to="/projects">Browse projects</Link>.</StatusState>}
    </>
  );
}
