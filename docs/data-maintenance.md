# A0 data maintenance

This page is for people who maintain the project's content. **You do not need to follow these steps to install or use the app.** The application reads the static data in `data/processes.json`.

## English data in this fork

In this English-only fork, `data/processes.json` is hand-maintained English. It was translated from the Portuguese A0 data in a one-shot run using `scripts/i18n/glossary.json` and `glossary.py`. `scripts/extract_a0.py` and `scripts/build_edges.py` are legacy tools for the Portuguese source: they match Portuguese patterns, so do not re-run them against the English data. Edges are validated by an edge-consistency check in `scripts/i18n`. The sections below describe the legacy Portuguese workflow.

## When to use

Use the scripts only if the A0 source PDF changes and you need to extract the processes again or recalculate the inferred connections.

## Extract the processes from the PDF

Run the commands from the project root. The extractor uses PyMuPDF and takes the path to the Portuguese A0 PDF:

```sh
python -m pip install pymupdf
python scripts/extract_a0.py "<path-to-A0-PDF>"
```

If the `python` command does not point to Python 3, use the name of the Python 3 executable available on your system.

By default, the result is written to `data/processes.generated.json`, without replacing `data/processes.json`. The generated file keeps the base dataset's metadata, reapplies the normalizations of cards 2.4, 4.2 and 6.5, preserves `a0Connectors` and recalculates the inferred connections. The base dataset must contain `a0Connectors`; if it does not, the script stops before writing.

Review the generated file before using it as the main dataset. The extraction depends on the PDF's visual and textual structure and should be checked whenever the source changes.

## Recalculate inferred connections

To generate a reviewed copy without changing the main dataset:

```sh
python scripts/build_edges.py data/processes.json data/processes.generated.json
```

When the input is a full dataset, the script replaces only `edges` and preserves the other keys, including `a0Connectors`. Without an explicit destination, it updates the input file itself. A bare list of processes cannot be overwritten without specifying an output file.

The current dataset contains 40 processes, 38 explicit A0 connectors and 203 inferred connections. These numbers are a reference for the current version; they may change if the source is updated.
