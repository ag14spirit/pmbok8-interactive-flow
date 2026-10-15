/** Project workspace model. Bump the schema version when persisted fields change. */
export const PROJECT_SCHEMA_VERSION = 1 as const;

export interface ProjectCard {
  id: string;
  title: string;
  notes: string;
  sourceProcessId?: string;
}

export interface ProjectStage {
  id: string;
  name: string;
  cardIds: string[];
}

export interface ProjectConnection {
  id: string;
  sourceCardId: string;
  targetCardId: string;
}

export interface UserProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stages: ProjectStage[];
  cards: ProjectCard[];
  connections: ProjectConnection[];
}

export interface ProjectCollection {
  version: typeof PROJECT_SCHEMA_VERSION;
  projects: UserProject[];
}

export interface ProjectRepository {
  load(): ProjectCollection;
  save(collection: ProjectCollection): void;
  readRaw(): string | null;
}
