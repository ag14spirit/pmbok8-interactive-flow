import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const data = JSON.parse(readFileSync(new URL("../../data/processes.json", import.meta.url), "utf8"));
const byId = new Map(data.processes.map((p) => [p.id, p]));
const names = (list) => new Set(list.flatMap((a) => [a.name, ...a.items]));

test("every edge artifact is an output of its source and an input of its target", () => {
  assert.equal(data.edges.length, 203);
  for (const e of data.edges) {
    for (const a of e.artifacts) {
      assert.ok(names(byId.get(e.source).outputs).has(a), `${e.id}: "${a}" not in source outputs`);
      assert.ok(names(byId.get(e.target).inputs).has(a), `${e.id}: "${a}" not in target inputs`);
    }
  }
});

test("no Portuguese text left in the data", () => {
  // sourceNotes quote the Portuguese A0 on purpose.
  const text = JSON.stringify(data, (k, v) => (k === "sourceNotes" ? undefined : v));
  const hit = text.match(/.{20}([ãõçáéíóúâêôà]|\b(Plano de|Análise|Gerenciar|Planejar)\b).{20}/i);
  assert.equal(hit, null, `Portuguese text: ${hit?.[0]}`);
});
