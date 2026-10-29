export type DomainId =
  | "governanca" | "escopo" | "cronograma" | "financas"
  | "partes-interessadas" | "recursos" | "riscos";

export type PhaseId =
  | "iniciacao" | "planejamento" | "execucao" | "monitoramento-controle" | "encerramento";

export interface ArtifactItem {
  name: string;
  items: string[];
  uncertain?: boolean;
}

export interface Process {
  id: string;
  name: string;
  domain: DomainId;
  phase: PhaseId;
  /** Card position in the original A0 (PDF points), used for the map layout. */
  position: { x: number; y: number; w: number; h: number };
  inputs: ArtifactItem[];
  tools: ArtifactItem[];
  outputs: ArtifactItem[];
  /** Notes on uncertainty or fidelity to the source. */
  flags: string[];
  /** Editorial corrections, with the literal A0 wording preserved for traceability. */
  sourceNotes?: string[];
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  artifacts: string[];
  basis: "artifact-match";
}

/** Double-headed connector, explicitly drawn between cards in the A0. */
export interface A0Connector {
  id: string;
  processes: [string, string];
}

export interface Domain { id: DomainId; number: number; name: string }
export interface Phase { id: PhaseId; order: number; name: string }
export interface Principle { id: number; name: string }

export interface FlowData {
  source: { title: string; adaptation: string; design: string; copyright: string; note: string };
  principles: Principle[];
  domains: Domain[];
  phases: Phase[];
  processes: Process[];
  edges: ProcessEdge[];
  a0Connectors: A0Connector[];
  edgesNote: string;
}
