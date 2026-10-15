"""Extrai os processos do PDF A0 para um dataset que preserva os conectores editoriais."""

import argparse
import json
import re
from pathlib import Path

import pymupdf as fitz

from build_edges import build_edges


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE = ROOT / "data" / "processes.json"
DEFAULT_OUTPUT = ROOT / "data" / "processes.generated.json"

NORMALIZED_NAMES = {
    "4.2": "Estimar os Custos",
    "6.5": "Monitorar e Controlar os Recursos",
}
NORMALIZED_OUTPUTS = {
    "2.4": {
        "estrutura analítica do trabalho (eat)": "Estrutura Analítica do Projeto (EAP)",
    },
}
SOURCE_NOTES = {
    "2.4": 'Saída normalizada para "Estrutura Analítica do Projeto (EAP)"; no A0 consta "estrutura analítica do trabalho (EAT)".',
    "4.2": 'Nome normalizado para "Estimar os Custos"; no A0 consta "Estime os Custos".',
    "6.5": 'Nome normalizado para "Monitorar e Controlar os Recursos"; no A0 consta "Monitoramento e Controle de Recursos".',
}

DOMAINS = {
    1: "governanca",
    2: "escopo",
    3: "cronograma",
    4: "financas",
    5: "partes-interessadas",
    6: "recursos",
    7: "riscos",
}
PHASES = {
    "iniciacao": ["1.1", "5.1"],
    "execucao": ["1.4", "1.5", "1.6", "6.3", "7.5", "6.4", "5.4", "5.5"],
    "monitoramento-controle": ["2.5", "2.6", "1.7", "3.3", "4.4", "1.8", "5.6", "5.7", "6.5", "7.6"],
    "encerramento": ["1.9"],
}
DOMAIN_LABELS = {
    "GOVERNANÇA", "ESCOPO", "CRONOGRAMA", "FINANÇAS", "PARTES INTERESSADAS",
    "RECURSOS", "RISCOS", "RISCO",
}


def phase_for(process_id: str) -> str:
    return next((phase for phase, ids in PHASES.items() if process_id in ids), "planejamento")


def normalized_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def extract_processes(source_pdf: Path) -> list[dict]:
    page = fitz.open(source_pdf)[0]
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).replace("\t", " ").strip()
            if text:
                lines.append((line["bbox"], text))

    headers = {}
    for bounds, text in lines:
        match = re.match(r"^(\d\.\d)\s*\|", text)
        if match:
            headers[match.group(1)] = bounds

    drawings = [
        item for item in page.get_drawings()
        if item["type"] == "f" and 150 < item["rect"].width < 200 and item["rect"].height > 60
    ]
    processes = []
    for process_id, header_bounds in sorted(headers.items(), key=lambda item: tuple(map(int, item[0].split(".")))):
        point = fitz.Point(header_bounds[0] + 3, header_bounds[1] + 5)
        containing = [drawing["rect"] for drawing in drawings if drawing["rect"].contains(point)]
        if not containing:
            raise ValueError(f"Não encontrei o cartão {process_id} no PDF.")
        rect = min(containing, key=lambda bounds: bounds.height)
        inside = [
            (bounds, text) for bounds, text in lines
            if rect.contains(fitz.Point((bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2))
        ]
        inside.sort(key=lambda item: (round(item[0][1]), item[0][0]))

        title = []
        current_section = None
        sections = {"inputs": [], "tools": [], "outputs": []}
        for _, text in inside:
            if re.match(r"^\d\.\d\s*\|", text) or text in DOMAIN_LABELS:
                continue
            if text == "ENTRADAS":
                current_section = "inputs"
                continue
            if text.startswith("FERRAMENTAS"):
                current_section = "tools"
                continue
            if text == "SAÍDAS":
                current_section = "outputs"
                continue
            if current_section is None:
                title.append(text)
                continue

            section = sections[current_section]
            if text.startswith("•"):
                section.append({"name": text[1:].strip(), "items": []})
            elif text.startswith("-"):
                if not section:
                    section.append({"name": "(sem item pai)", "items": [], "uncertain": True})
                section[-1]["items"].append(text[1:].strip())
            elif section and section[-1]["items"]:
                section[-1]["items"][-1] += " " + text
            elif section:
                section[-1]["name"] += " " + text

        for section in sections.values():
            for item in section:
                item["name"] = normalized_text(item["name"])

        name = normalized_text(" ".join(title))
        if process_id in NORMALIZED_NAMES:
            name = NORMALIZED_NAMES[process_id]
        for output in sections["outputs"]:
            source_name = normalized_text(output["name"]).lower()
            output["name"] = NORMALIZED_OUTPUTS.get(process_id, {}).get(source_name, output["name"])

        flags = [f"seção {key} vazia na extração" for key, values in sections.items() if not values]
        process = {
            "id": process_id,
            "name": name,
            "domain": DOMAINS[int(process_id[0])],
            "phase": phase_for(process_id),
            "position": {
                "x": round(rect.x0), "y": round(rect.y0),
                "w": round(rect.width), "h": round(rect.height),
            },
            **sections,
            "flags": flags,
        }
        if process_id in SOURCE_NOTES:
            process["sourceNotes"] = [SOURCE_NOTES[process_id]]
        processes.append(process)

    if len(processes) != 40:
        raise ValueError(f"Extraí {len(processes)} cartões; eram esperados 40.")
    return processes


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_pdf", type=Path, help="PDF A0 em português usado como fonte.")
    parser.add_argument("--base", type=Path, default=DEFAULT_BASE, help="Dataset-base com metadados e conectores explícitos do A0.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Destino do dataset completo gerado (padrão: data/processes.generated.json).")
    args = parser.parse_args()

    dataset = json.loads(args.base.read_text(encoding="utf-8"))
    if not isinstance(dataset, dict) or not isinstance(dataset.get("a0Connectors"), list):
        parser.error("O dataset-base precisa conter a lista a0Connectors; nenhum arquivo foi escrito.")

    dataset["processes"] = extract_processes(args.source_pdf)
    dataset["edges"] = build_edges(dataset["processes"])
    args.output.write_text(json.dumps(dataset, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"40 processos, {len(dataset['a0Connectors'])} conectores explícitos do A0 e {len(dataset['edges'])} conexões inferidas em {args.output}")


if __name__ == "__main__":
    main()
