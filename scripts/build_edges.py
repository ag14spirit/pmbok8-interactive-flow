"""Regenera conexões inferidas sem descartar metadados ou conectores do A0."""

import argparse
import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "processes.json"

GENERIC = re.compile(
    r"^(etc|fatores ambientais|ativos de processos|plano de gerenciamento do projeto$|"
    r"documentos do projeto|atualizac|qualquer componente|todos os componentes|"
    r"saidas de outros|sem item pai)"
)


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower())
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = re.sub(r"[^a-z0-9 ]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return re.sub(r"^(plano de gerenciamento) (do|da|de|dos|das) ", r"\1 ", value)


def is_generic(value: str) -> bool:
    value = unicodedata.normalize("NFKD", value.lower())
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = re.sub(r"[^a-z0-9 ]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return bool(GENERIC.match(value))


def build_edges(processes: list[dict]) -> list[dict]:
    def outputs(process: dict) -> list[str]:
        return [item["name"] for item in process["outputs"] if not is_generic(item["name"])]

    def inputs(process: dict) -> list[str]:
        result = []
        for item in process["inputs"]:
            if not is_generic(item["name"]):
                result.append(item["name"])
            result.extend(child for child in item["items"] if not is_generic(child))
        return result

    edges = []
    for source in processes:
        output_by_name = {normalize(name): name for name in outputs(source)}
        for target in processes:
            if source["id"] == target["id"]:
                continue
            shared = sorted({output_by_name[normalize(name)] for name in inputs(target) if normalize(name) in output_by_name})
            if shared:
                edges.append({
                    "id": f"{source['id']}->{target['id']}",
                    "source": source["id"],
                    "target": target["id"],
                    "artifacts": shared,
                    "basis": "artifact-match",
                })
    return edges


def rebuild_document(document):
    """Rebuild inferred edges while preserving the full dataset envelope."""
    if isinstance(document, list):
        return build_edges(document)
    if not isinstance(document, dict) or not isinstance(document.get("processes"), list):
        raise ValueError("A entrada precisa ser uma lista de processos ou o dataset completo.")
    if "a0Connectors" not in document:
        raise ValueError("O dataset não contém a0Connectors; nenhum arquivo foi escrito.")

    document["edges"] = build_edges(document["processes"])
    return document


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", nargs="?", type=Path, default=DEFAULT_DATA, help="Dataset completo (padrão: data/processes.json).")
    parser.add_argument("output", nargs="?", type=Path, help="Destino opcional; por padrão, atualiza o próprio dataset completo.")
    args = parser.parse_args()

    document = json.loads(args.input.read_text(encoding="utf-8"))
    result = rebuild_document(document)
    if isinstance(document, list) and args.output is None:
        parser.error("Uma lista de processos não pode ser sobrescrita. Informe um arquivo de saída para gerar somente edges.")

    destination = args.output or args.input
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(result['edges']) if isinstance(result, dict) else len(result)} conexões inferidas em {destination}")


if __name__ == "__main__":
    main()
