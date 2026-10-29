# Interactive PMBOK 8 Flow · @colabdeveloper

An educational tool for exploring the 40 processes of the PMBOK® Guide 8th edition, studying how they relate, and building your own flows.

This is an English-only fork of [rodrigochavesoa/pmbok8-interactive-flow](https://github.com/rodrigochavesoa/pmbok8-interactive-flow).

**[Open the project online](https://ag14spirit.github.io/pmbok8-interactive-flow/)** · Use the app in your browser, no installation needed.

[![Next.js 15.5](https://img.shields.io/badge/Next.js-15.5-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT for code](https://img.shields.io/badge/License-MIT%20for%20code-2154c2)](LICENSE)

<p align="center">
  <img src="docs/images/orientado-por-valor-readme.png" alt="Screenshot of the Interactive PMBOK 8 Flow in the Value-driven view" width="840">
</p>

<p align="center"><sub>Value-driven view — explore the board through its clickable cards and present it in full screen.</sub></p>

## Features

- **Map** (React Flow): soft areas for each focus area, colors by domain, zoom, pan and a minimap. It initially shows the 38 explicit A0 connectors and offers the 203 connections inferred from inputs and outputs as an alternative view.
- **Study board** (dnd-kit): cards and focus areas scroll independently on desktop; on mobile, each card also has a focus-area selector. Your attempt is saved automatically in this browser and can be resumed after reloading. Use Check, Show answer or New attempt.
- **My project**: create multiple projects, each with its own flow of named stages, cards with notes and optional directional connections. Catalog cards are added as editable copies. Content is saved locally and can be exported/imported as JSON; there is no account and no sync.
- **Value-driven**: a vertical board derived from the simplified A3, with all 40 clickable cards, a details panel that keeps full screen active, and domain filters in the bottom legend. On mobile, the board can be explored by scrolling horizontally.
- **Resources**: links to consult PMBOK® 8 at PMI, access free courses and explore Ricardo Vargas's materials.
- **Side panel**: inputs, tools and techniques, outputs, and links to the processes each one receives from and feeds, based on the inferred connections.
- **Filters**: by domain and by search (which also looks inside inputs and outputs).

The five process groups (Initiating, Planning, Executing, Monitoring and Controlling, Closing) appear as "focus areas" in the UI; the JSON and code keep the identifier `phases`.

## Useful links

- [Ricardo Vargas's PMBOK® 8 flow](https://get.ricardo-vargas.com/pmbok8en) · [Explainer video](https://youtu.be/TZMum9cuoJY)
- [PMBOK® on the PMI site](https://www.pmi.org/standards/pmbok) · [Free introduction to PMI-CPMAI™](https://www.pmi.org/shop/brazil/p-/elearning/free-introduction-to-cognitive-project-management-in-ai-cpmai/el185)

## Run locally from GitHub
1. Install Git and Node.js 20 LTS or later.
2. In the GitHub repository, click **Code**, copy the HTTPS URL and run in a terminal:
   ```
   git clone <HTTPS URL copied from GitHub>
   cd pmbok-flow-app
   npm install
   npm run dev
   ```
3. Open http://localhost:3100

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Publish to GitHub Pages

The GitHub Actions workflow validates the static export on pull requests and publishes after the merge to `main`. To enable publishing, go to **Settings → Pages** and choose **GitHub Actions** as the source. The repository site will be at `https://ag14spirit.github.io/pmbok8-interactive-flow/`.

Publishing uses the same app and does not change local mode. The Pages build is opt-in and configured only by the workflow. Projects and progress live in browser storage: each origin has its own data, so `localhost` and the published site do not automatically share content. Project import and export remain available for manual transfer.

## Structure
- `data/processes.json`: principles, domains, phases (shown as focus areas in the UI), 40 processes (with inputs, tools, outputs, `flags` and normalization notes), `a0Connectors` and `edges`.
- `lib/data/ProcessRepository.ts`: interface for the flow's reference content. `JsonProcessRepository.ts` is the current implementation, and `index.ts` chooses the adapter. `lib/projects/` separates the versioned project model from its local persistence so another adapter can be added in the future.
- `components/flow/`: `FlowApp`, `MapView`, `BoardView`, `ValueView`, `MyProjectsView`, `ResourcesView` and `ProcessSheet`. `components/ui/`: shared shadcn/ui components, including accessible confirmations in the app's visual style.
- `public/value-oriented.png`: high-resolution render of the original A3 board, to keep the composition, arrows and typography of the source in the vertical presentation.
- `scripts/`: dataset maintenance utilities. See [A0 data maintenance](docs/data-maintenance.md) only if you need to update the data from the source PDF.

## About the connections
The `a0Connectors` record the 38 connectors explicitly drawn between cards in the A0 PDF; their arrows have heads in both directions. The 203 `edges` are directed relations inferred when a named output of process A appears as an input of process B. They are a study layer based on name matching, not a transcription of PMI's official sequencing and not a confirmation of causality between processes.

To avoid a web of lines, the generation of these inferred connections ignores broad or recurring items: enterprise environmental factors (EEF), organizational process assets (OPA), "Etc.", "Project management plan", "Project documents" and updates. **This filter affects only the inferred lines:** it does not remove inputs or outputs from the cards, does not change the explicit A0 connectors, and does not claim that the ignored items are irrelevant. So the absence of an inferred line does not mean two processes are unrelated; it only means no link was created from the names selected by this rule. The side panel keeps the inferred relations and the cards still show their full lists of inputs and outputs.

The names of cards 4.2 and 6.5 and the WBS output of card 2.4 were normalized. The literal A0 wording is preserved in `sourceNotes` in the JSON, outside the notices shown to the user. The extraction reapplies these normalizations and notes on every run.

The A3 board in **Value-driven** preserves the original art, including the literal wording of 4.2 and 6.5. When you open the cards, the panel shows the normalized names and the details. The rest of the interface follows the color, typography and surface tokens of the project's design system.

Source: PMI, PMBOK® Guide 8th ed. Flow adapted by Ricardo Vargas. This app does not replace reading the Guide.

## License

The original code of this project is released under the MIT license. Third-party boards, data and images remain subject to the rights and conditions of their owners and are not licensed under the MIT license. See [Third-party content and materials](THIRD_PARTY_NOTICES.md) for the credits and detailed scope.
