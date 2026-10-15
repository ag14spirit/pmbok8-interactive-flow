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
  /** Posição do cartão no A0 original (pontos PDF), usada para o layout do mapa. */
  position: { x: number; y: number; w: number; h: number };
  inputs: ArtifactItem[];
  tools: ArtifactItem[];
  outputs: ArtifactItem[];
  /** Observações de incerteza ou fidelidade à fonte. */
  flags: string[];
  /** Correções editoriais, com a redação literal do A0 preservada para rastreabilidade. */
  sourceNotes?: string[];
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  artifacts: string[];
  basis: "artifact-match";
}

/** Conector com pontas nos dois sentidos, desenhado explicitamente entre cartões no A0. */
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
