import { JsonProcessRepository } from "./JsonProcessRepository";
import type { ProcessRepository } from "./ProcessRepository";

/** Ponto único de escolha do adapter (JSON hoje; Supabase depois). */
export function getProcessRepository(): ProcessRepository {
  return new JsonProcessRepository();
}

export type { ProcessRepository } from "./ProcessRepository";
export * from "./types";
