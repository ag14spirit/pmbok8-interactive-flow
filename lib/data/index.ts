import { JsonProcessRepository } from "./JsonProcessRepository";
import type { ProcessRepository } from "./ProcessRepository";

/** Single place to choose the adapter (JSON today; Supabase later). */
export function getProcessRepository(): ProcessRepository {
  return new JsonProcessRepository();
}

export type { ProcessRepository } from "./ProcessRepository";
export * from "./types";
