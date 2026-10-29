"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { Check, RotateCcw, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlowData, Phase, PhaseId, Process } from "@/lib/data/types";
import { DOMAIN_COLORS } from "@/lib/domain-style";

const POOL = "pool";
const STORAGE_KEY = "pmbok-flow:study-board:v1";
type Placement = Record<string, PhaseId | typeof POOL>;
type SavedStudyState = {
  version: 1;
  placement: Placement;
  checked: boolean;
  seed: number;
  started: boolean;
};

function readSavedStudyState(data: FlowData, initial: Placement): SavedStudyState | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") return null;
  const saved = value as Partial<SavedStudyState>;
  if (saved.version !== 1 || !saved.placement || typeof saved.placement !== "object") return null;

  const phaseIds = new Set(data.phases.map((phase) => phase.id));
  const placement = { ...initial };
  for (const process of data.processes) {
    const savedPhase = saved.placement[process.id];
    if (savedPhase === POOL || phaseIds.has(savedPhase as PhaseId)) {
      placement[process.id] = savedPhase as PhaseId | typeof POOL;
    }
  }

  return {
    version: 1,
    placement,
    checked: saved.checked === true,
    seed: Number.isSafeInteger(saved.seed) && (saved.seed as number) >= 0 ? saved.seed as number : 7,
    started: saved.started === true,
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CardBody({ p, status }: { p: Process; status?: "ok" | "erro" }) {
  const c = DOMAIN_COLORS[p.domain];
  return (
    <div className="flex items-stretch overflow-hidden rounded-[12px] border bg-card shadow-[var(--shadow-soft)]">
      <div className="w-1.5 shrink-0" style={{ background: c.solid }} />
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2">
        <span className="font-mono text-[11px] font-semibold" style={{ color: c.ink }}>{p.id}</span>
        <span className="min-w-0 flex-1 text-[13px] leading-tight font-semibold">{p.name}</span>
        {status === "ok" && <span className="flex size-5 items-center justify-center rounded-full" style={{ background: "var(--success-bg)", color: "var(--success-ink)" }} aria-label="Correct"><Check className="size-3.5" strokeWidth={2.4} /></span>}
        {status === "erro" && <span className="flex size-5 items-center justify-center rounded-full" style={{ background: "var(--danger-bg)", color: "var(--danger-ink)" }} aria-label="Wrong phase"><X className="size-3.5" strokeWidth={2.4} /></span>}
      </div>
    </div>
  );
}

function DraggableCard({ p, status, onOpen }: { p: Process; status?: "ok" | "erro"; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: p.id });
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.35 : 1 }}
      className="cursor-grab touch-none active:cursor-grabbing"
      onClick={() => onOpen(p.id)}
      {...listeners}
      {...attributes}
    >
      <CardBody p={p} status={status} />
    </div>
  );
}

function Zone({ id, title, count, children, wide }: { id: string; title: string; count: number; children: React.ReactNode; wide?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="flex min-h-[180px] min-w-0 shrink-0 flex-col rounded-[24px] border p-3 transition-colors"
      style={{ background: isOver ? "#e6efff" : "var(--surface)", borderColor: isOver ? "var(--brand)" : undefined, boxShadow: "var(--shadow-card)" }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="eyebrow">{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{count}</span>
      </div>
      <div className={wide ? "grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" : "flex flex-col gap-2"}>{children}</div>
    </div>
  );
}

function BoardSkeleton() {
  const block = (className: string) => <div aria-hidden="true" className={`skeleton-shimmer rounded-lg ${className}`} />;

  return (
    <div role="status" aria-label="Preparing the study board" aria-busy="true" className="flex h-full min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain p-4 md:overflow-hidden md:p-6">
      <div className="flex flex-col gap-3 rounded-[24px] border bg-card p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-4">
        <div className="flex-1 space-y-2">
          {block("h-3 w-24")}
          {block("h-4 w-64 max-w-full")}
        </div>
        <div className="flex gap-2">
          {block("h-10 flex-1 sm:w-28")}
          {block("hidden h-10 w-32 sm:block")}
          {block("hidden h-10 w-28 sm:block")}
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-1 gap-4 md:min-h-0 md:flex-1 md:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 md:min-h-0">
          <div className="min-h-[180px] rounded-[24px] border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-center justify-between">{block("h-3 w-36")}{block("h-5 w-8 rounded-full")}</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton-shimmer h-12 rounded-xl border" aria-hidden="true" />)}
          </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 md:grid md:min-h-0 md:grid-cols-2 md:content-start md:items-start">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="min-h-[180px] rounded-[24px] border bg-card p-3 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between">{block("h-3 w-28")}{block("h-5 w-8 rounded-full")}</div>
              <div className="space-y-2">{block("h-12 w-full rounded-xl border")}{block("h-12 w-full rounded-xl border")}</div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Preparing the study board…</span>
    </div>
  );
}

interface Props {
  data: FlowData;
  visibleIds: Set<string>;
  onOpen: (id: string) => void;
}

export function BoardView({ data, visibleIds, onOpen }: Props) {
  const initial = useMemo<Placement>(() => Object.fromEntries(data.processes.map((p) => [p.id, POOL])), [data.processes]);
  const [placement, setPlacement] = useState<Placement>(initial);
  const [checked, setChecked] = useState(false);
  const [seed, setSeed] = useState(7);
  const [hydrated, setHydrated] = useState(false);
  const [hasStoredAttempt, setHasStoredAttempt] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  useEffect(() => {
    try {
      const saved = readSavedStudyState(data, initial);
      setStorageAvailable(true);
      if (saved) {
        setPlacement(saved.placement);
        setChecked(saved.checked);
        setSeed(saved.seed);
        setHasStoredAttempt(true);
        setHasProgress(saved.started);
      }
    } catch {
      setStorageAvailable(false);
    }
    setHydrated(true);
  }, [data, initial]);

  useEffect(() => {
    if (!hydrated || !hasStoredAttempt) return;
    const saved: SavedStudyState = { version: 1, placement, checked, seed, started: hasProgress };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setStorageAvailable(true);
    } catch {
      // The board stays usable when the browser blocks local storage.
      setStorageAvailable(false);
    }
  }, [hydrated, hasStoredAttempt, placement, checked, seed, hasProgress]);

  const markProgress = () => {
    setHasStoredAttempt(true);
    setHasProgress(true);
  };

  const byId = useMemo(() => new Map(data.processes.map((p) => [p.id, p])), [data]);
  const order = useMemo(() => shuffle(data.processes, seed).map((p) => p.id), [data, seed]);
  const visible = order.filter((id) => visibleIds.has(id));

  const placed = visible.filter((id) => placement[id] !== POOL);
  const correct = placed.filter((id) => placement[id] === byId.get(id)!.phase);
  const placementProgress = visible.length ? (placed.length / visible.length) * 100 : 0;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const nextPhase = e.over.id as PhaseId;
    if (placement[id] === nextPhase) return;
    setPlacement((prev) => ({ ...prev, [id]: nextPhase }));
    setChecked(false);
    markProgress();
  };
  const status = (id: string) => (!checked || placement[id] === POOL ? undefined : placement[id] === byId.get(id)!.phase ? "ok" : "erro");
  const card = (id: string) => (
    <div key={id} className="flex min-w-0 items-stretch gap-2">
      <div className="min-w-0 flex-1"><DraggableCard p={byId.get(id)!} status={status(id)} onOpen={onOpen} /></div>
      <select
        aria-label={`Focus area of process ${id}`}
        value={placement[id]}
        onChange={(event) => {
          const nextPhase = event.target.value as PhaseId | typeof POOL;
          if (placement[id] === nextPhase) return;
          setPlacement((prev) => ({ ...prev, [id]: nextPhase }));
          setChecked(false);
          markProgress();
        }}
        className="w-24 shrink-0 rounded-xl border bg-card px-1 text-[11px] font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-ring md:hidden"
      >
        <option value={POOL}>Focus area…</option>
        {data.phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
      </select>
    </div>
  );
  const phaseZone = (phase: Phase) => {
    const ids = visible.filter((id) => placement[id] === phase.id);
    return (
      <div key={phase.id} className="min-w-0" style={{ order: phase.order }}>
        <Zone id={phase.id} title={phase.name} count={ids.length}>
          {ids.map(card)}
        </Zone>
      </div>
    );
  };

  if (!hydrated) {
    return <BoardSkeleton />;
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain p-4 md:overflow-hidden md:p-6">
        <div className="flex flex-col gap-3 rounded-[24px] border bg-card p-3 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
          <div className="sm:mr-auto">
            <p className="eyebrow">Study mode</p>
            <p className="text-sm text-muted-foreground">Drag each card to the focus area where it happens. <span className="md:hidden">On a phone, use the selector beside it.</span> Then click Check.</p>
          </div>
          <div className="w-full rounded-xl border bg-secondary/40 px-3 py-2 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <span className="text-xs font-medium text-muted-foreground sm:hidden">Progress</span>
              <div className="text-sm font-semibold tabular-nums">
            {checked ? <>Correct: <span style={{ color: "var(--success-ink)" }}>{correct.length}</span> of {placed.length} placed</> : <>{placed.length} of {visible.length} placed</>}
              </div>
            </div>
            <div role="progressbar" aria-label="Cards placed" aria-valuemin={0} aria-valuemax={visible.length} aria-valuenow={placed.length} className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted sm:hidden">
              <div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${placementProgress}%` }} />
            </div>
            {hasProgress && <span role="status" className="mt-1 block text-[11px] font-medium text-muted-foreground">{storageAvailable === false ? "Could not save in this browser" : "Progress saved in this browser"}</span>}
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button onClick={() => { setChecked(true); markProgress(); }} className="col-span-2 h-11 w-full min-w-0 rounded-xl px-3 text-sm font-bold sm:w-auto sm:px-4"><Check strokeWidth={1.8} /> Check</Button>
          <Button variant="outline" className="h-11 w-full min-w-0 rounded-xl px-2 text-xs font-bold sm:w-auto sm:px-4 sm:text-sm" onClick={() => { setPlacement(Object.fromEntries(data.processes.map((p) => [p.id, p.phase]))); setChecked(true); markProgress(); }}><Eye strokeWidth={1.8} /> Show answer</Button>
          <Button variant="outline" className="h-11 w-full min-w-0 rounded-xl px-2 text-xs font-bold sm:w-auto sm:px-4 sm:text-sm" onClick={() => {
            try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* The on-screen state can still be reset. */ }
            setPlacement(initial);
            setChecked(false);
            setSeed((s) => s + 1);
            setHasProgress(false);
            setHasStoredAttempt(true);
          }}><RotateCcw strokeWidth={1.8} /> New attempt</Button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-4 md:min-h-0 md:flex-1 md:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 md:min-h-0 md:overflow-x-hidden md:overflow-y-auto md:pr-1">
            <Zone id={POOL} title="Cards to place" count={visible.filter((id) => placement[id] === POOL).length} wide>
              {visible.filter((id) => placement[id] === POOL).map(card)}
            </Zone>
          </div>
          <div className="flex min-w-0 flex-col gap-3 md:grid md:min-h-0 md:grid-cols-2 md:content-start md:items-start md:overflow-x-hidden md:overflow-y-auto md:pr-1">
            <div className="contents md:flex md:min-w-0 md:flex-col md:gap-3">
              {data.phases.filter((phase) => phase.order % 2 === 1).map(phaseZone)}
            </div>
            <div className="contents md:flex md:min-w-0 md:flex-col md:gap-3">
              {data.phases.filter((phase) => phase.order % 2 === 0).map(phaseZone)}
            </div>
          </div>
        </div>
      </div>
      <DragOverlay>{activeId ? <div className="w-64 rotate-1"><CardBody p={byId.get(activeId)!} /></div> : null}</DragOverlay>
    </DndContext>
  );
}
