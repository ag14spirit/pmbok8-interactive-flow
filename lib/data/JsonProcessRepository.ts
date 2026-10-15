import raw from "@/data/processes.json";
import type { ProcessRepository } from "./ProcessRepository";
import type { FlowData } from "./types";

const data = raw as unknown as FlowData;

export class JsonProcessRepository implements ProcessRepository {
  async getFlow(): Promise<FlowData> {
    return data;
  }
  async getProcess(id: string) {
    return data.processes.find((p) => p.id === id);
  }
  async getEdgesFor(id: string) {
    return {
      incoming: data.edges.filter((e) => e.target === id),
      outgoing: data.edges.filter((e) => e.source === id),
    };
  }
}
