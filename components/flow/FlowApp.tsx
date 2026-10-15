"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { LayoutGrid, Network, Search, ScanLine, BriefcaseBusiness, BookOpen, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { DomainId, FlowData } from "@/lib/data/types";
import { DOMAIN_COLORS } from "@/lib/domain-style";
import { MapView } from "./MapView";
import { BoardView } from "./BoardView";
import { ValueView } from "./ValueView";
import { ProcessSheet } from "./ProcessSheet";
import { MyProjectsView } from "./MyProjectsView";
import { ResourcesView } from "./ResourcesView";

const views = [
  { id: "mapa", label: "Mapa", Icon: Network },
  { id: "quadro", label: "Quadro de estudo", Icon: LayoutGrid },
  { id: "valor", label: "Orientado por Valor", Icon: ScanLine },
  { id: "projetos", label: "Meu projeto", Icon: BriefcaseBusiness },
  { id: "recursos", label: "Recursos", Icon: BookOpen },
] as const;
type FlowView = (typeof views)[number]["id"];

function SearchField({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
  return <div className={`relative w-full ${className ?? ""}`}>
    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
    <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Buscar processo, entrada, saída…" className="h-10 rounded-xl bg-card pl-9 sm:h-11" aria-label="Buscar processo, entrada e saída" />
  </div>;
}

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function FlowApp({ data }: { data: FlowData }) {
  const [view, setView] = useState<FlowView>("mapa");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<Set<DomainId>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | null>(null);

  const visibleIds = useMemo(() => {
    const q = norm(query.trim());
    return new Set(
      data.processes
        .filter((p) => domains.size === 0 || domains.has(p.domain))
        .filter((p) => {
          if (!q) return true;
          const hay = [p.id, p.name, ...[...p.inputs, ...p.tools, ...p.outputs].flatMap((a) => [a.name, ...a.items])].join(" ");
          return norm(hay).includes(q);
        })
        .map((p) => p.id),
    );
  }, [data, query, domains]);

  const open = (id: string) => { setSelectedId(id); setSheetOpen(true); };
  const toggleDomain = (d: DomainId) =>
    setDomains((prev) => { const n = new Set(prev); if (n.has(d)) n.delete(d); else n.add(d); return n; });

  const selected = sheetOpen && selectedId ? data.processes.find((p) => p.id === selectedId) ?? null : null;
  const showSearch = view !== "projetos" && view !== "recursos";

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur-[18px]">
        <div className="flex flex-col gap-2 px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
            <Image src="/brand/simbolo-infinito.png" alt="" width={28} height={28} className="h-7 w-auto" priority />
            <div className="min-w-0 flex-1">
              <p className="eyebrow leading-none">Fluxo de processos · PMBOK® 8</p>
              <h1 className="truncate text-base leading-tight font-[760] tracking-[-0.035em] sm:text-lg">
                Fluxos PMBOK® 8 <span className="hidden lg:inline" style={{ color: "var(--accent-ink)" }}>para explorar e criar</span>
              </h1>
            </div>
            <Button type="button" variant="outline" className="min-h-10 shrink-0 gap-2 rounded-xl px-3 md:hidden" aria-label="Abrir menu de navegação" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>
              <Menu aria-hidden="true" className="size-4" /> Menu
            </Button>
            <div className="ml-auto hidden w-full max-w-xs md:block">
              {showSearch ? <SearchField value={query} onChange={setQuery} /> : <div aria-hidden="true" className="h-11" />}
            </div>
          </div>
          <div className="md:hidden">
            {showSearch ? <SearchField value={query} onChange={setQuery} /> : <div aria-hidden="true" className="h-10" />}
          </div>
          <div className="hidden w-full min-w-0 md:block">
            <Tabs value={view} onValueChange={(v) => setView(v as FlowView)}>
              <TabsList className="grid h-auto w-full grid-cols-5 gap-1 rounded-[14px] bg-secondary p-1 group-data-horizontal/tabs:h-auto">
                {views.map(({ id, label, Icon }) => <TabsTrigger key={id} value={id} className="h-auto min-h-11 min-w-0 gap-1 rounded-[10px] px-2 py-1 text-center text-xs leading-tight font-bold whitespace-normal group-data-horizontal/tabs:h-auto"><Icon className="shrink-0" strokeWidth={1.8} /> {label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
        </div>
        {view !== "projetos" && view !== "recursos" && <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-3 whitespace-nowrap md:flex-wrap md:overflow-visible md:px-6">
          <span className="eyebrow mr-1 shrink-0">Domínios</span>
          {data.domains.map((d) => {
            const c = DOMAIN_COLORS[d.id];
            const on = domains.has(d.id);
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDomain(d.id)}
                className="flex min-h-[28px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-ring"
                style={on ? { background: c.solid, color: "#fff", borderColor: c.solid } : { background: c.soft, color: c.ink, borderColor: "transparent" }}
              >
                <span className="size-2 rounded-full" style={{ background: on ? "#fff" : c.solid }} />
                {d.number} {d.name}
              </button>
            );
          })}
          {(domains.size > 0 || query) && (
            <button type="button" onClick={() => { setDomains(new Set()); setQuery(""); }} className="text-[11px] font-bold text-[var(--accent-ink)] underline-offset-2 hover:underline">
              Limpar filtros
            </button>
          )}
          <span className="ml-auto shrink-0 text-[11px] font-semibold text-muted-foreground tabular-nums">{visibleIds.size} de {data.processes.length} processos</span>
        </div>}
        {view !== "valor" && view !== "projetos" && view !== "recursos" && <div className="hide-scrollbar hidden items-center gap-2 overflow-x-auto border-t bg-[var(--hero)] px-4 py-2 whitespace-nowrap md:flex md:flex-wrap md:overflow-visible md:px-6">
          <span className="mr-1 shrink-0 text-[10px] font-extrabold tracking-[.14em] text-[#b6d0ff] uppercase">6 princípios</span>
          {data.principles.map((p) => (
            <span key={p.id} className="shrink-0 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">{p.name}</span>
          ))}
        </div>}
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] gap-0 p-0 md:hidden">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="text-lg font-bold">Navegação</SheetTitle>
          </SheetHeader>
          <nav aria-label="Navegação principal" className="flex flex-col gap-1 p-3">
            {views.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-current={view === id ? "page" : undefined} onClick={() => { setView(id); setMobileNavOpen(false); }}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-ring ${view === id ? "bg-[var(--brand)] text-white" : "text-foreground hover:bg-secondary"}`}>
                <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <main className="min-h-0 flex-1">
        {view === "recursos"
          ? <ResourcesView />
          : view === "projetos"
          ? <MyProjectsView processes={data.processes} />
          : view === "mapa"
          ? <MapView data={data} visibleIds={visibleIds} selectedId={selectedId} query={query} onSelect={open} />
          : view === "quadro"
            ? <BoardView data={data} visibleIds={visibleIds} onOpen={open} />
            : <ValueView data={data} visibleIds={visibleIds} activeDomains={domains} onToggleDomain={toggleDomain} onFullscreenTargetChange={setFullscreenContainer} onOpen={open} />}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-card px-4 py-2 text-[11px] text-[#6b7684] md:px-6">
        <span>{view === "projetos" ? "Catálogo de referência: PMI, Guia PMBOK® 8ª ed. · Fluxo adaptado por Ricardo Vargas. Este app não substitui a leitura do Guia." : "Fonte: PMI, Guia PMBOK® 8ª ed. · Fluxo adaptado por Ricardo Vargas. Não substitui a leitura do Guia."}</span>
        <span className="flex items-center gap-2">
          <Image src="/brand/simbolo-infinito.png" alt="" width={18} height={18} className="h-[18px] w-auto" />
          <span className="signature text-[13px]">@colabdeveloper</span>
        </span>
      </footer>

      <ProcessSheet data={data} process={selected} onClose={() => setSheetOpen(false)} onNavigate={open} portalContainer={fullscreenContainer} />
    </div>
  );
}
