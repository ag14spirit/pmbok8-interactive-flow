import { PROJECT_SCHEMA_VERSION, type ProjectCollection, type ProjectRepository, type UserProject } from "./types";

export const PROJECT_STORAGE_KEY = "pmbok-flow:user-projects:v1";
export const PROJECT_IMPORT_MAX_BYTES = 50 * 1024 * 1024;

export class ProjectStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectStorageError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function validateProject(value: unknown): value is UserProject {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" ||
      typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" ||
      !Array.isArray(value.stages) || !Array.isArray(value.cards) || !Array.isArray(value.connections)) return false;

  if (value.name.trim().length === 0 || value.name.length > 120 || value.stages.length === 0 || value.stages.length > 100 || value.cards.length > 1000 || value.connections.length > 5000) return false;
  const cards = new Set<string>();
  for (const card of value.cards) {
    if (!isRecord(card) || typeof card.id !== "string" || typeof card.title !== "string" || card.title.trim().length === 0 || typeof card.notes !== "string" ||
        card.title.length > 200 || (card.sourceProcessId !== undefined && (typeof card.sourceProcessId !== "string" || card.sourceProcessId.length > 100))) return false;
    if (cards.has(card.id)) return false;
    cards.add(card.id);
  }

  const stages = new Set<string>();
  const placed = new Set<string>();
  for (const stage of value.stages) {
    if (!isRecord(stage) || typeof stage.id !== "string" || typeof stage.name !== "string" || stage.name.trim().length === 0 || stage.name.length > 120 || !Array.isArray(stage.cardIds)) return false;
    if (stages.has(stage.id)) return false;
    stages.add(stage.id);
    for (const id of stage.cardIds) {
      if (typeof id !== "string" || !cards.has(id) || placed.has(id)) return false;
      placed.add(id);
    }
  }
  if (placed.size !== cards.size) return false;

  const connections = new Set<string>();
  const pairs = new Set<string>();
  for (const edge of value.connections) {
    if (!isRecord(edge) || typeof edge.id !== "string" || typeof edge.sourceCardId !== "string" || typeof edge.targetCardId !== "string") return false;
    if (!cards.has(edge.sourceCardId) || !cards.has(edge.targetCardId) || edge.sourceCardId === edge.targetCardId || connections.has(edge.id)) return false;
    connections.add(edge.id);
    const pair = `${edge.sourceCardId}\u0000${edge.targetCardId}`;
    if (pairs.has(pair)) return false;
    pairs.add(pair);
  }
  return true;
}

export function validateProjectCollection(value: unknown): value is ProjectCollection {
  if (!isRecord(value) || value.version !== PROJECT_SCHEMA_VERSION || !Array.isArray(value.projects)) return false;
  const ids = new Set<string>();
  for (const project of value.projects) {
    if (!validateProject(project) || ids.has(project.id)) return false;
    ids.add(project.id);
  }
  return true;
}

export function parseProjectImport(raw: string): ProjectCollection {
  const size = new Blob([raw]).size;
  if (size > PROJECT_IMPORT_MAX_BYTES) throw new ProjectStorageError("O arquivo ultrapassa o limite de 50 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ProjectStorageError("Este arquivo não contém um JSON válido.");
  }
  if (!validateProjectCollection(parsed)) {
    throw new ProjectStorageError("O arquivo não corresponde a um backup válido desta versão do Meu projeto.");
  }
  return parsed;
}

export class LocalStorageProjectRepository implements ProjectRepository {
  load(): ProjectCollection {
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return { version: PROJECT_SCHEMA_VERSION, projects: [] };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch {
      throw new ProjectStorageError("Os dados locais estão corrompidos. Exporte uma cópia antes de substituir os dados.");
    }
    if (!validateProjectCollection(parsed)) {
      throw new ProjectStorageError("Os dados locais têm uma versão ou estrutura incompatível. Exporte-os antes de continuar.");
    }
    return parsed;
  }

  readRaw(): string | null {
    try { return window.localStorage.getItem(PROJECT_STORAGE_KEY); } catch { return null; }
  }

  save(collection: ProjectCollection): void {
    if (!validateProjectCollection(collection)) {
      throw new ProjectStorageError("Há um campo sem nome ou dado inválido. Revise o fluxo antes de salvar.");
    }
    try {
      window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(collection));
    } catch {
      throw new ProjectStorageError("Não foi possível salvar. O armazenamento do navegador pode estar indisponível ou cheio. Exporte seu trabalho antes de fechar esta página.");
    }
  }
}
