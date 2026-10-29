"use client";

import { ArrowDownLeft, ArrowUpRight, TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ArtifactItem, FlowData, Process } from "@/lib/data/types";
import { DOMAIN_COLORS } from "@/lib/domain-style";

interface Props {
  data: FlowData;
  process: Process | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
  portalContainer?: HTMLElement | null;
}

function ArtifactList({ title, list }: { title: string; list: ArtifactItem[] }) {
  return (
    <section className="rounded-[18px] border bg-card p-4">
      <h3 className="eyebrow mb-2">{title}</h3>
      <ul className="space-y-1.5 text-sm">
        {list.map((a, i) => (
          <li key={i}>
            <span className="font-medium text-foreground">{a.name}</span>
            {a.items.length > 0 && (
              <ul className="mt-1 ml-4 list-disc space-y-0.5 text-[13px] text-muted-foreground">
                {a.items.map((s, j) => <li key={j}>{s}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProcessSheet({ data, process, onClose, onNavigate, portalContainer }: Props) {
  const open = process !== null;
  const byId = new Map(data.processes.map((p) => [p.id, p]));
  const incoming = process ? data.edges.filter((e) => e.target === process.id) : [];
  const outgoing = process ? data.edges.filter((e) => e.source === process.id) : [];
  const domain = process ? data.domains.find((d) => d.id === process.domain) : undefined;
  const phase = process ? data.phases.find((p) => p.id === process.phase) : undefined;
  const color = process ? DOMAIN_COLORS[process.domain] : undefined;

  const Links = ({ title, edges, dir }: { title: string; edges: typeof incoming; dir: "in" | "out" }) => (
    <section className="rounded-[18px] border bg-card p-4">
      <h3 className="eyebrow mb-2">{title} ({edges.length})</h3>
      {edges.length === 0 && <p className="text-sm text-muted-foreground">No derived connections.</p>}
      <ul className="space-y-2">
        {edges.map((e) => {
          const other = byId.get(dir === "in" ? e.source : e.target)!;
          const c = DOMAIN_COLORS[other.domain];
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onNavigate(other.id)}
                className="group flex w-full items-start gap-2 rounded-xl p-2 text-left hover:bg-secondary focus-visible:outline-3 focus-visible:outline-ring"
              >
                {dir === "in" ? <ArrowDownLeft className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} /> : <ArrowUpRight className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />}
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="rounded-md px-1.5 py-0.5 font-mono text-[11px] text-white" style={{ background: c.solid }}>{other.id}</span>
                    <span className="group-hover:underline">{other.name}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{e.artifacts.join(" · ")}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" portalContainer={portalContainer} className="w-full gap-0 p-0 sm:max-w-xl data-[side=right]:sm:max-w-xl">
        {process && color && (
          <>
            <SheetHeader className="border-b p-6" style={{ borderTop: `6px solid ${color.solid}` }}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md px-2 py-0.5 font-mono font-semibold text-white" style={{ background: color.solid }}>{process.id}</span>
                <span className="rounded-full px-2.5 py-0.5 font-bold" style={{ background: color.soft, color: color.ink }}>{domain?.name}</span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 font-bold text-muted-foreground">{phase?.name}</span>
              </div>
              <SheetTitle className="text-2xl font-[700] tracking-[-0.035em]">{process.name}</SheetTitle>
              <SheetDescription>Inputs, tools and techniques, and outputs of the process.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 p-6">
                {process.flags.length > 0 && (
                  <div className="flex gap-2 rounded-[14px] p-3 text-sm" style={{ background: "var(--warning-bg)", color: "var(--warning-ink)" }}>
                    <TriangleAlert className="size-4 shrink-0" strokeWidth={1.8} />
                    <div>{process.flags.map((f, i) => <p key={i}>{f}</p>)}</div>
                  </div>
                )}
                <ArtifactList title="Inputs" list={process.inputs} />
                <ArtifactList title="Tools and techniques" list={process.tools} />
                <ArtifactList title="Outputs" list={process.outputs} />
                <p className="px-1 text-xs text-muted-foreground">Connections inferred from the named inputs and outputs.</p>
                <Links title="Receives from" edges={incoming} dir="in" />
                <Links title="Feeds into" edges={outgoing} dir="out" />
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
