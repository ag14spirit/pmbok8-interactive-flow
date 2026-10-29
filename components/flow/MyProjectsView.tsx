"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Download, Info, LayoutGrid, Link2, Network, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Process } from "@/lib/data/types";
import { LocalStorageProjectRepository, parseProjectImport, PROJECT_IMPORT_MAX_BYTES, ProjectStorageError } from "@/lib/projects/LocalStorageProjectRepository";
import { PROJECT_SCHEMA_VERSION, type ProjectCard, type ProjectCollection, type ProjectConnection, type ProjectStage, type UserProject } from "@/lib/projects/types";
import { ProjectCanvasView } from "./ProjectCanvasView";

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const now = () => new Date().toISOString();
type Notice = { message: string; type: "info" | "success" | "error" };
type Confirmation = { title: string; description: string; confirmLabel: string; onConfirm: () => void };

function createProject(name: string): UserProject {
  const id = newId();
  return {
    id, name, createdAt: now(), updatedAt: now(),
    stages: [{ id: newId(), name: "Stage 1", cardIds: [] }], cards: [], connections: [],
  };
}

function remapImportedProjects(collection: ProjectCollection): UserProject[] {
  return collection.projects.map((project) => {
    const cardIds = new Map(project.cards.map((card) => [card.id, newId()]));
    const stageIds = new Map(project.stages.map((stage) => [stage.id, newId()]));
    const stamp = now();
    return {
      ...project,
      id: newId(),
      createdAt: stamp,
      updatedAt: stamp,
      cards: project.cards.map((card) => ({ ...card, id: cardIds.get(card.id)! })),
      stages: project.stages.map((stage) => ({ ...stage, id: stageIds.get(stage.id)!, cardIds: stage.cardIds.map((id) => cardIds.get(id)!) })),
      connections: project.connections.map((edge) => ({ ...edge, id: newId(), sourceCardId: cardIds.get(edge.sourceCardId)!, targetCardId: cardIds.get(edge.targetCardId)! })),
    };
  });
}

export function MyProjectsView({ processes }: { processes: Process[] }) {
  const repository = useMemo(() => new LocalStorageProjectRepository(), []);
  const [collection, setCollection] = useState<ProjectCollection>({ version: PROJECT_SCHEMA_VERSION, projects: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInProgress = useRef(false);
  const isMounted = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [recoveryData, setRecoveryData] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [stageName, setStageName] = useState("");
  const [cardTitle, setCardTitle] = useState("");
  const [cardNotes, setCardNotes] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [connectionSource, setConnectionSource] = useState("");
  const [connectionTarget, setConnectionTarget] = useState("");
  const [projectDisplay, setProjectDisplay] = useState<"board" | "canvas">("board");

  useEffect(() => {
    try {
      const loaded = repository.load();
      setCollection(loaded);
      setActiveId(loaded.projects[0]?.id ?? null);
      setStorageReady(true);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Could not read local data.", type: "error" });
      setRecoveryData(repository.readRaw());
    }
    setHydrated(true);
  }, [repository]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      importInProgress.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !storageReady) return;
    try {
      repository.save(collection);
      setNotice((current) => current?.type === "error" && /sav(e|ing)|storage|local data/i.test(current.message) ? null : current);
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Could not save in this browser.", type: "error" });
    }
  }, [collection, hydrated, repository, storageReady]);

  const active = collection.projects.find((project) => project.id === activeId) ?? null;
  const processesById = useMemo(() => new Map(processes.map((process) => [process.id, process])), [processes]);
  const cardsById = useMemo(() => new Map(active?.cards.map((card) => [card.id, card]) ?? []), [active]);

  useEffect(() => { setProjectNameDraft(active?.name ?? ""); }, [active?.id, active?.name]);

  const updateProject = (update: (project: UserProject) => UserProject) => {
    if (!active) return;
    setStorageReady(true);
    setCollection((current) => ({
      ...current,
      projects: current.projects.map((project) => project.id === active.id ? { ...update(project), updatedAt: now() } : project),
    }));
  };

  const addProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) return;
    const project = createProject(name.slice(0, 120));
    setCollection((current) => ({ ...current, projects: [...current.projects, project] }));
    setStorageReady(true);
    setActiveId(project.id);
    setProjectName("");
  };

  const removeProject = () => {
    if (!active) return;
    const project = active;
    setConfirmation({
      title: `Delete “${project.name}”?`,
      description: "The project, its stages, cards, and connections will be removed from this device. This cannot be undone.",
      confirmLabel: "Delete project",
      onConfirm: () => {
        const remaining = collection.projects.filter((item) => item.id !== project.id);
        setCollection((current) => ({ ...current, projects: remaining }));
        setActiveId(remaining[0]?.id ?? null);
        setConfirmation(null);
      },
    });
  };

  const commitProjectName = () => {
    if (!active) return;
    const name = projectNameDraft.trim();
    if (!name) { setProjectNameDraft(active.name); return; }
    updateProject((project) => ({ ...project, name: name.slice(0, 120) }));
  };

  const addStage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = stageName.trim();
    if (!active || !name) return;
    updateProject((project) => ({ ...project, stages: [...project.stages, { id: newId(), name: name.slice(0, 120), cardIds: [] }] }));
    setStageName("");
  };

  const renameStage = (stageId: string, name: string) => {
    if (!name.trim()) return;
    updateProject((project) => ({
      ...project, stages: project.stages.map((stage) => stage.id === stageId ? { ...stage, name: name.slice(0, 120) } : stage),
    }));
  };

  const reorderStage = (index: number, direction: -1 | 1) => {
    if (!active) return;
    const target = index + direction;
    if (target < 0 || target >= active.stages.length) return;
    updateProject((project) => {
      const stages = [...project.stages];
      [stages[index], stages[target]] = [stages[target], stages[index]];
      return { ...project, stages };
    });
  };

  const deleteStage = (stage: ProjectStage) => {
    if (!active || active.stages.length <= 1 || stage.cardIds.length > 0) return;
    updateProject((project) => ({ ...project, stages: project.stages.filter((item) => item.id !== stage.id) }));
  };

  const saveCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = cardTitle.trim();
    if (!active || !title) return;
    if (editingCardId) {
      updateProject((project) => ({ ...project, cards: project.cards.map((card) => card.id === editingCardId ? { ...card, title: title.slice(0, 200), notes: cardNotes } : card) }));
    } else {
      const card: ProjectCard = { id: newId(), title: title.slice(0, 200), notes: cardNotes, ...(referenceId ? { sourceProcessId: referenceId } : {}) };
      updateProject((project) => ({ ...project, cards: [...project.cards, card], stages: project.stages.map((stage, index) => index === 0 ? { ...stage, cardIds: [...stage.cardIds, card.id] } : stage) }));
    }
    setCardTitle(""); setCardNotes(""); setReferenceId(""); setEditingCardId(null);
  };

  const beginEditCard = (card: ProjectCard) => {
    setEditingCardId(card.id); setCardTitle(card.title); setCardNotes(card.notes); setReferenceId("");
    document.getElementById("project-card-title")?.focus();
  };

  const cancelEdit = () => { setEditingCardId(null); setCardTitle(""); setCardNotes(""); };

  const moveCard = (cardId: string, stageId: string) => updateProject((project) => ({
    ...project,
    stages: project.stages.map((stage) => ({ ...stage, cardIds: stage.id === stageId ? [...stage.cardIds.filter((id) => id !== cardId), cardId] : stage.cardIds.filter((id) => id !== cardId) })),
  }));

  const deleteCard = (cardId: string) => {
    if (!active) return;
    const card = active.cards.find((item) => item.id === cardId);
    if (!card) return;
    setConfirmation({
      title: `Delete “${card.title}”?`,
      description: "The card and all connections linked to it will be removed from this flow. This cannot be undone.",
      confirmLabel: "Delete card",
      onConfirm: () => {
        updateProject((project) => ({
          ...project,
          cards: project.cards.filter((item) => item.id !== cardId),
          stages: project.stages.map((stage) => ({ ...stage, cardIds: stage.cardIds.filter((id) => id !== cardId) })),
          connections: project.connections.filter((edge) => edge.sourceCardId !== cardId && edge.targetCardId !== cardId),
        }));
        if (editingCardId === cardId) cancelEdit();
        setConfirmation(null);
      },
    });
  };

  const addConnection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active || !connectionSource || !connectionTarget || connectionSource === connectionTarget) return;
    if (active.connections.some((edge) => edge.sourceCardId === connectionSource && edge.targetCardId === connectionTarget)) return;
    const connection: ProjectConnection = { id: newId(), sourceCardId: connectionSource, targetCardId: connectionTarget };
    updateProject((project) => ({ ...project, connections: [...project.connections, connection] }));
    setConnectionSource(""); setConnectionTarget("");
  };

  const exportProjects = () => {
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "my-projects-pmbok-flow.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const exportRecoveryData = () => {
    if (recoveryData === null) return;
    const blob = new Blob([recoveryData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "local-data-recovery.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const importProjects = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importInProgress.current) return;
    importInProgress.current = true;
    setIsImporting(true);
    setNotice(null);
    let unsavedCollection: ProjectCollection | null = null;
    try {
      if (file.size > PROJECT_IMPORT_MAX_BYTES) throw new ProjectStorageError("The file exceeds the 50 MB limit.");
      const raw = await file.text();
      if (!isMounted.current || !importInProgress.current) return;
      const parsed = parseProjectImport(raw);
      const copies = remapImportedProjects(parsed);
      const nextCollection: ProjectCollection = { ...collection, projects: [...collection.projects, ...copies] };
      unsavedCollection = nextCollection;
      repository.save(nextCollection);
      setCollection(nextCollection);
      setStorageReady(true);
      setRecoveryData(null);
      setActiveId(copies[0]?.id ?? activeId);
      setNotice({ message: `${copies.length} ${copies.length === 1 ? "project imported" : "projects imported"}. The originals were kept.`, type: "success" });
    } catch (error) {
      if (isMounted.current) {
        if (unsavedCollection) setRecoveryData(JSON.stringify(unsavedCollection, null, 2));
        setNotice({ message: error instanceof Error ? error.message : "Could not import this file.", type: "error" });
      }
    } finally {
      importInProgress.current = false;
      if (isMounted.current) setIsImporting(false);
    }
  };

  if (!hydrated) return (
    <section role="status" aria-label="Preparing your workspace" aria-busy="true" className="h-full min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 motion-safe:animate-pulse motion-reduce:animate-none">
        <div className="flex flex-col gap-3 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1 space-y-2"><div className="h-3 w-28 rounded-full bg-muted" /><div className="h-6 w-44 max-w-full rounded-lg bg-muted" /><div className="h-4 w-full max-w-lg rounded-lg bg-muted" /></div>
          <div className="flex gap-2"><div className="h-11 w-28 rounded-xl bg-muted" /><div className="h-11 w-28 rounded-xl bg-muted" /></div>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(230px,280px)_minmax(0,1fr)]">
          <div className="min-h-48 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)]"><div className="h-5 w-36 rounded-lg bg-muted" /><div className="mt-4 h-11 rounded-xl bg-muted" /><div className="mt-4 flex gap-2"><div className="h-11 w-24 rounded-xl bg-muted" /><div className="h-11 w-24 rounded-xl bg-muted" /></div><div className="mt-5 h-12 rounded-xl bg-muted" /></div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2"><div className="min-h-64 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)]"><div className="h-10 rounded-xl bg-muted" /><div className="mt-4 h-20 rounded-2xl bg-muted" /><div className="mt-3 h-20 rounded-2xl bg-muted" /></div><div className="min-h-64 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)]"><div className="h-5 w-32 rounded-lg bg-muted" /><div className="mt-4 h-11 rounded-xl bg-muted" /><div className="mt-3 h-28 rounded-xl bg-muted" /></div></div>
        </div>
      </div>
    </section>
  );

  return (
    <>
    <section className="h-full min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6" aria-labelledby="my-projects-heading" aria-busy={isImporting}>
      {isImporting && <div role="status" className="mx-auto mb-3 max-w-[1500px] rounded-xl border border-primary/20 bg-secondary/60 px-3 py-2 text-sm font-medium text-foreground">Importing and saving projects…</div>}
      <fieldset disabled={isImporting} className="m-0 min-w-0 border-0 p-0">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="flex flex-col gap-3 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Workspace</p>
            <h2 id="my-projects-heading" className="text-xl font-[760] tracking-[-0.035em]">My project</h2>
            <p className="mt-1 text-sm text-muted-foreground">Build a flow that makes sense for your context. The stages and cards are yours.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={exportProjects} disabled={collection.projects.length === 0}><Download /> Export</Button>
            <Button asChild type="button" variant="outline" className="min-h-11 rounded-xl"><label><Upload /><span>Import</span><input type="file" accept="application/json,.json" className="sr-only" onChange={importProjects} aria-label="Import projects file" /></label></Button>
          </div>
        </header>

        {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`flex flex-col gap-3 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${notice.type === "error" ? "border-[var(--danger-ink)]/20 bg-[var(--danger-bg)] text-[var(--danger-ink)]" : notice.type === "success" ? "border-[var(--success-ink)]/20 bg-[var(--success-bg)] text-[var(--success-ink)]" : "border-border bg-card text-foreground"}`}>
          <div className="flex min-w-0 items-start gap-2"><span className="mt-0.5 shrink-0" aria-hidden="true">{notice.type === "error" ? <AlertCircle className="size-4" /> : notice.type === "success" ? <CheckCircle2 className="size-4" /> : <Info className="size-4" />}</span><span>{notice.message}</span></div>
          {recoveryData !== null ? <Button type="button" variant="outline" className="min-h-11 self-start" onClick={exportRecoveryData}>Download recovery copy</Button> : notice.type === "error" && /storage|sav(e|ing)/i.test(notice.message) ? <Button type="button" variant="outline" className="min-h-11 self-start" onClick={exportProjects}>Export now</Button> : <button type="button" className="self-start rounded-md p-1 focus-visible:outline-3 focus-visible:outline-ring" aria-label="Dismiss notice" onClick={() => setNotice(null)}><X className="size-4" /></button>}
        </div>}

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(230px,280px)_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-3 rounded-[24px] border bg-card p-3 shadow-[var(--shadow-card)]" aria-label="Your projects">
            <form onSubmit={addProject} className="flex gap-2">
              <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={120} placeholder="Project name" aria-label="New project name" className="h-11 rounded-xl" />
              <Button type="submit" size="icon" className="size-11 shrink-0 rounded-xl" aria-label="Create project" disabled={!projectName.trim()}><Plus /></Button>
            </form>
            <ul className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible" aria-label="Project list">
              {collection.projects.map((project) => <li key={project.id} className="min-w-0 shrink-0 xl:w-full"><button type="button" aria-current={activeId === project.id ? "page" : undefined} onClick={() => { setActiveId(project.id); cancelEdit(); }} className={`min-h-11 max-w-[220px] truncate rounded-xl border px-3 text-left text-sm font-semibold focus-visible:outline-3 focus-visible:outline-ring xl:w-full xl:max-w-none ${activeId === project.id ? "border-primary bg-accent text-accent-foreground" : "bg-background hover:bg-secondary"}`}>{project.name}</button></li>)}
            </ul>
            {collection.projects.length === 0 && <p className="hidden px-2 pb-2 text-xs text-muted-foreground xl:block">Create your first project. Each project contains a flow.</p>}
          </aside>

          {active ? <div className="flex min-w-0 flex-col gap-4">
            <section className="flex flex-col gap-3 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
              <label className="min-w-0 flex-1"><span className="eyebrow mb-1 block">Project name</span><Input value={projectNameDraft} maxLength={120} onChange={(event) => setProjectNameDraft(event.target.value)} onBlur={commitProjectName} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitProjectName(); event.currentTarget.blur(); } }} aria-label="Current project name" className="h-11 rounded-xl font-semibold" /></label>
              <Button type="button" variant="destructive" className="min-h-11 rounded-xl self-start sm:self-end" onClick={removeProject}><Trash2 /> Delete project</Button>
            </section>

            <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(250px,300px)]">
              <div className="min-w-0">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="eyebrow">Custom flow</p><h3 className="text-lg font-bold">{projectDisplay === "board" ? "Stages and cards" : "Project canvas"}</h3><p className="mt-0.5 text-xs text-muted-foreground">{active.cards.length} {active.cards.length === 1 ? "card" : "cards"} · {active.stages.length} {active.stages.length === 1 ? "stage" : "stages"}</p></div>
                  <div role="group" aria-label="Flow view" className="flex w-full rounded-xl border bg-card p-1 sm:w-auto">
                    <button type="button" aria-pressed={projectDisplay === "board"} onClick={() => setProjectDisplay("board")} className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-ring sm:flex-none ${projectDisplay === "board" ? "bg-[var(--brand)] text-white" : "text-muted-foreground hover:bg-secondary"}`}><LayoutGrid aria-hidden="true" className="size-4" /> Board</button>
                    <button type="button" aria-pressed={projectDisplay === "canvas"} onClick={() => setProjectDisplay("canvas")} className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-ring sm:flex-none ${projectDisplay === "canvas" ? "bg-[var(--brand)] text-white" : "text-muted-foreground hover:bg-secondary"}`}><Network aria-hidden="true" className="size-4" /> Canvas</button>
                  </div>
                </div>
                {projectDisplay === "board" ? <>
                  <div className="grid min-w-0 grid-cols-1 gap-3 md:[grid-template-columns:repeat(var(--stage-cols-md),minmax(0,1fr))] 2xl:[grid-template-columns:repeat(var(--stage-cols-wide),minmax(0,1fr))]" style={{ "--stage-cols-md": Math.min(active.stages.length, 2), "--stage-cols-wide": Math.min(active.stages.length, 3) } as CSSProperties}>
                    {active.stages.map((stage, index) => <StageColumn key={stage.id} stage={stage} index={index} stages={active.stages} cardsById={cardsById} connections={active.connections} onRename={renameStage} onReorder={reorderStage} onDelete={deleteStage} onMove={moveCard} onEdit={beginEditCard} onDeleteCard={deleteCard} />)}
                  </div>
                  <form onSubmit={addStage} className="mt-3 flex gap-2 rounded-2xl border bg-card p-3">
                    <Input value={stageName} onChange={(event) => setStageName(event.target.value)} maxLength={120} placeholder="New stage name" aria-label="New stage name" className="h-11 rounded-xl" />
                    <Button type="submit" variant="outline" className="min-h-11 shrink-0 rounded-xl" disabled={!stageName.trim()}><Plus /> Add stage</Button>
                  </form>
                </> : <ProjectCanvasView key={active.id} stages={active.stages} cards={active.cards} connections={active.connections} onOpenCard={(card) => { setProjectDisplay("board"); beginEditCard(card); }} />}
              </div>

              <aside className="flex min-w-0 flex-col gap-4">
                <form onSubmit={saveCard} className="flex flex-col gap-3 rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)]" aria-labelledby="card-form-heading">
                  <div><p className="eyebrow">{editingCardId ? "Edit card" : "New card"}</p><h3 id="card-form-heading" className="text-base font-bold">{editingCardId ? "Update the content" : "Add to the flow"}</h3></div>
                  <label className="text-xs font-semibold">Title<Input id="project-card-title" value={cardTitle} onChange={(event) => setCardTitle(event.target.value)} maxLength={200} required placeholder="E.g., Validate hypothesis with users" className="mt-1 h-11 rounded-xl" /></label>
                  <label className="text-xs font-semibold">Notes <span className="font-normal text-muted-foreground">(optional)</span><textarea value={cardNotes} onChange={(event) => setCardNotes(event.target.value)} rows={4} placeholder="Context, decisions, or observations" className="mt-1 min-h-[120px] max-h-52 w-full resize-y overflow-y-auto rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" /></label>
                  {!editingCardId && <label className="text-xs font-semibold">Use a catalog process as a reference <span className="font-normal text-muted-foreground">(optional)</span><select value={referenceId} onChange={(event) => { const id = event.target.value; setReferenceId(id); const source = processesById.get(id); if (source) setCardTitle(source.name); }} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium focus-visible:outline-3 focus-visible:outline-ring"><option value="">Custom card</option>{processes.map((process) => <option key={process.id} value={process.id}>{process.id} · {process.name}</option>)}</select><span className="mt-1 block text-xs font-normal text-muted-foreground">An editable copy will be created; the catalog does not change.</span></label>}
                  <div className="flex flex-wrap gap-2"><Button type="submit" className="min-h-11 rounded-xl" disabled={!cardTitle.trim()}><Plus /> {editingCardId ? "Save card" : "Add card"}</Button>{editingCardId && <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={cancelEdit}>Cancel</Button>}</div>
                </form>

                <section className="rounded-[24px] border bg-card p-4 shadow-[var(--shadow-card)]" aria-labelledby="connections-heading">
                  <div className="mb-3"><p className="eyebrow">Optional relationships</p><h3 id="connections-heading" className="text-base font-bold">Connections between cards</h3><p className="mt-1 text-xs text-muted-foreground">Set a direction between two cards. This does not change the order of the stages.</p></div>
                  {active.cards.length < 2 ? <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Add at least two cards to create a connection.</p> : <form onSubmit={addConnection} className="flex flex-col gap-2">
                    <label className="text-xs font-semibold">From<select value={connectionSource} onChange={(event) => setConnectionSource(event.target.value)} required className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-3 focus-visible:outline-ring"><option value="">Select a card</option>{active.cards.map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label>
                    <label className="text-xs font-semibold">To<select value={connectionTarget} onChange={(event) => setConnectionTarget(event.target.value)} required className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-3 focus-visible:outline-ring"><option value="">Select a card</option>{active.cards.filter((card) => card.id !== connectionSource).map((card) => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label>
                    <Button type="submit" variant="outline" className="min-h-11 rounded-xl" disabled={!connectionSource || !connectionTarget || active.connections.some((edge) => edge.sourceCardId === connectionSource && edge.targetCardId === connectionTarget)}><Link2 /> Create connection</Button>
                  </form>}
                  {active.connections.length > 0 && <ul className="mt-3 space-y-2" aria-label="Connections in this flow">{active.connections.map((edge) => <li key={edge.id} className="flex min-w-0 items-center gap-2 rounded-xl border bg-background p-2.5 text-xs"><span className="min-w-0 flex-1 truncate font-semibold">{cardsById.get(edge.sourceCardId)?.title}<span className="px-1.5 text-primary" aria-label="to">→</span>{cardsById.get(edge.targetCardId)?.title}</span><button type="button" onClick={() => updateProject((project) => ({ ...project, connections: project.connections.filter((item) => item.id !== edge.id) }))} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-visible:outline-3 focus-visible:outline-ring" aria-label={`Remove connection from ${cardsById.get(edge.sourceCardId)?.title} to ${cardsById.get(edge.targetCardId)?.title}`}><X className="size-4" /></button></li>)}</ul>}
                </section>
              </aside>
            </div>
          </div> : <section className="flex min-h-[300px] min-w-0 flex-col items-center justify-center rounded-[24px] border bg-card p-6 text-center shadow-[var(--shadow-card)] xl:min-h-[520px]">
            <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Plus className="size-5" /></span><h3 className="text-lg font-bold">Start a flow for your project</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">Create your project on the side. Then add stages, custom cards, or editable copies from the catalog.</p>
          </section>}
        </div>
        <p className="px-1 text-xs text-muted-foreground">Your projects are saved in this browser and on this device. Export a file to keep a copy or transfer it to another device.</p>
      </div>
      </fieldset>
    </section>
    <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--danger-bg)] text-[var(--danger-ink)]"><Trash2 aria-hidden="true" className="size-5" /></span>
            <div className="min-w-0"><AlertDialogTitle>{confirmation?.title}</AlertDialogTitle><AlertDialogDescription className="mt-1">{confirmation?.description}</AlertDialogDescription></div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild><Button type="button" variant="outline" className="min-h-11 rounded-xl">Cancel</Button></AlertDialogCancel>
          <AlertDialogAction asChild><Button type="button" variant="destructive" className="min-h-11 rounded-xl" onClick={() => confirmation?.onConfirm()}>{confirmation?.confirmLabel ?? "Delete"}</Button></AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function StageColumn({ stage, index, stages, cardsById, connections, onRename, onReorder, onDelete, onMove, onEdit, onDeleteCard }: {
  stage: ProjectStage; index: number; stages: ProjectStage[]; cardsById: Map<string, ProjectCard>; connections: ProjectConnection[];
  onRename: (id: string, name: string) => void; onReorder: (index: number, direction: -1 | 1) => void; onDelete: (stage: ProjectStage) => void;
  onMove: (cardId: string, stageId: string) => void; onEdit: (card: ProjectCard) => void; onDeleteCard: (id: string) => void;
}) {
  const [nameDraft, setNameDraft] = useState(stage.name);
  useEffect(() => setNameDraft(stage.name), [stage.id, stage.name]);
  const commitName = () => {
    const name = nameDraft.trim();
    if (!name) { setNameDraft(stage.name); return; }
    onRename(stage.id, name);
  };
  return <section className="flex min-w-0 flex-col rounded-[24px] border bg-card p-3 shadow-[var(--shadow-card)]" aria-label={`Stage ${index + 1}: ${stage.name}`}>
    <div className="mb-3 flex min-w-0 items-start gap-1">
      <label className="min-w-0 flex-1"><span className="sr-only">Stage {index + 1} name</span><Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onBlur={commitName} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitName(); event.currentTarget.blur(); } }} maxLength={120} aria-label={`Stage ${index + 1} name`} className="h-10 rounded-xl border-transparent bg-secondary/70 px-2 font-bold focus-visible:border-ring" /></label>
      <div className="flex shrink-0 gap-0.5"><Button type="button" variant="ghost" size="icon" className="!size-11" aria-label={`Move stage ${stage.name} up`} disabled={index === 0} onClick={() => onReorder(index, -1)}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon" className="!size-11" aria-label={`Move stage ${stage.name} down`} disabled={index === stages.length - 1} onClick={() => onReorder(index, 1)}><ArrowDown /></Button><Button type="button" variant="ghost" size="icon" className="!size-11" aria-label={`Delete stage ${stage.name}`} disabled={stages.length <= 1 || stage.cardIds.length > 0} onClick={() => onDelete(stage)}><Trash2 /></Button></div>
    </div>
    <ul className="flex min-h-20 flex-col gap-2" aria-label={`Cards in ${stage.name}`}>
      {stage.cardIds.map((id) => {
        const card = cardsById.get(id);
        if (!card) return null;
        const connectedCount = connections.filter((edge) => edge.sourceCardId === id || edge.targetCardId === id).length;
        return <li key={id} className="min-w-0 rounded-2xl border bg-background p-3">
          <div className="flex min-w-0 items-start justify-between gap-2"><div className="min-w-0"><h4 className="break-words text-sm font-semibold leading-snug">{card.title}</h4>{card.sourceProcessId && <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Reference: {card.sourceProcessId}</p>}{card.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{card.notes}</p>}{connectedCount > 0 && <p className="mt-2 text-[11px] font-semibold text-[var(--accent-ink)]">{connectedCount} {connectedCount === 1 ? "connection" : "connections"}</p>}</div>
            <div className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="icon" className="!size-11" aria-label={`Edit card ${card.title}`} onClick={() => onEdit(card)}><Pencil /></Button><Button type="button" variant="ghost" size="icon" className="!size-11" aria-label={`Delete card ${card.title}`} onClick={() => onDeleteCard(id)}><Trash2 /></Button></div></div>
          <label className="mt-3 block text-[11px] font-semibold text-muted-foreground">Move to<select value={stage.id} onChange={(event) => onMove(id, event.target.value)} aria-label={`Move ${card.title} to another stage`} className="mt-1 h-10 w-full rounded-xl border border-input bg-card px-2 text-xs font-medium text-foreground focus-visible:outline-3 focus-visible:outline-ring">{stages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </li>;
      })}
      {stage.cardIds.length === 0 && <li className="rounded-xl border border-dashed bg-secondary/40 p-4 text-center text-xs text-muted-foreground">No cards in this stage yet.</li>}
    </ul>
  </section>;
}
