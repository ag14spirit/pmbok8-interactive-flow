import type { DomainId } from "./data/types";

/** Cores sóbrias por domínio, inspiradas na legenda do A0 e ajustadas para contraste AA com texto branco. */
export const DOMAIN_COLORS: Record<DomainId, { solid: string; soft: string; ink: string }> = {
  governanca: { solid: "#2b3347", soft: "#eceef3", ink: "#2b3347" },
  escopo: { solid: "#24408f", soft: "#e8edf8", ink: "#24408f" },
  cronograma: { solid: "#0b6f8f", soft: "#e4f2f6", ink: "#0b5f7a" },
  financas: { solid: "#1d6b43", soft: "#e5f3ea", ink: "#1d6b43" },
  "partes-interessadas": { solid: "#7e3b72", soft: "#f4e9f2", ink: "#7e3b72" },
  recursos: { solid: "#a1484f", soft: "#f8eaeb", ink: "#93404a" },
  riscos: { solid: "#8a6410", soft: "#f8f0dc", ink: "#77560c" },
};
