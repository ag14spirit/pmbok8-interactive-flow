import type { FlowData, Process, ProcessEdge } from "./types";

/**
 * Contrato de acesso aos dados do fluxo. A UI depende só desta interface,
 * então um SupabaseProcessRepository pode entrar depois sem mexer no front.
 */
export interface ProcessRepository {
  getFlow(): Promise<FlowData>;
  getProcess(id: string): Promise<Process | undefined>;
  getEdgesFor(id: string): Promise<{ incoming: ProcessEdge[]; outgoing: ProcessEdge[] }>;
}
