import type { FlowData, Process, ProcessEdge } from "./types";

/**
 * Contract for accessing the flow data. The UI depends only on this interface,
 * so a SupabaseProcessRepository can be added later without touching the front end.
 */
export interface ProcessRepository {
  getFlow(): Promise<FlowData>;
  getProcess(id: string): Promise<Process | undefined>;
  getEdgesFor(id: string): Promise<{ incoming: ProcessEdge[]; outgoing: ProcessEdge[] }>;
}
