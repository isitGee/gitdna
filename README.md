# gitDNA

**Understand the code before you touch it.**

gitDNA turns unfamiliar GitHub repositories into clear visual maps, project insights, and guided paths through the code. Paste a public repository URL and get an interactive analysis built from the repository's real structure.

## What it does

* **DNA view** — project identity, technology stack, language composition, project structure, characteristics, important files, and repository health, all derived from actual repository data.
* **Map view** — an interactive architecture map generated from the repository: entry points, core folders, interface, services, data, tests, configuration, automation, and external dependencies as connected nodes. Supports zoom, pan, fit to screen, reset, group filtering, search, a minimap, node detail panels, and plain English explanations.
* **Guide view** — an automatically generated exploration path (README, entry point, core, components, services, data, tests) with difficulty levels, plus recommended first files, configuration files, and tests.
* **Repository search** — search files, folders, technologies, concepts, and guide steps (Ctrl K). Selecting a result highlights it on the map.
* **Shareable analysis** — a gitDNA link per repository, a live session link, and a README badge snippet.
* **Official technology logos** — the technology stack renders real brand marks (React, TypeScript, Docker, and 80 more) generated from simple-icons data at build time.
* **Light and dark mode** — a full Windows 11 style dual palette that follows the system preference, with a manual toggle that persists across visits.

## How analysis works

1. Repository metadata, file tree, and language stats come from GitHub's public REST API (no credentials required, no keys in the frontend).
2. A small set of package manifests is fetched as raw text to detect frameworks and dependencies.
3. Everything else — folders, entry points, tests, configuration, architecture graph, guide path, health observations — is computed locally from the real file tree.
4. Nothing is invented: characteristics and health rows only state what was detected, and truncated trees are reported honestly.

## Architecture

```
src/
  lib/        github.ts (API client) · analyze.ts (analysis engine) ·
              graph.ts (architecture graph + layout) · guide.ts (exploration path) ·
              explain.ts (plain English explanations) · demo.ts (demo dataset)
  state/      analysis.tsx (analysis lifecycle)
  router.ts   hash routing (#/github/owner/repo, #/demo)
  components/ Nav, Landing, AnalysisSequence, Workspace,
              dna/, map/, guide/, SearchOverlay, ShareDialog, States
```

## Development

```bash
npm install
npm run dev          # dev server
npm run build        # production build
npm test             # render tests + DOM interaction tests (no network)
npm run test:live    # analyzes a real repository over the network
npm run gen:logos    # regenerate brand logo data from simple-icons
```

## Notes

* The public GitHub API allows about 60 requests per hour per visitor; gitDNA uses three to four per analysis. Rate limit exhaustion is handled with a friendly message.
* Very large repositories are sampled breadth first across folders, and the analysis says so.
