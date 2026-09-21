import type { EdgeKind, FileInfo, FolderSummary, GraphEdge, GraphNode, RepoGraph, RepoMeta, TechItem } from '../types'
import { testRootFolder } from './analyze'

export interface GraphInput {
  meta: RepoMeta
  files: FileInfo[]
  topFolders: FolderSummary[]
  entryPoints: FileInfo[]
  testFiles: FileInfo[]
  configFiles: FileInfo[]
  tech: TechItem[]
  manifestTexts: Record<string, string>
  hasWorkflows: boolean
  readmePath?: string
}

const GROUP_LABELS: Record<string, string> = {
  entry: 'Entry point', core: 'Application core', ui: 'Interface',
  services: 'Services and data access', data: 'Data and resources',
  external: 'External services', config: 'Configuration', tests: 'Testing',
  docs: 'Documentation', ci: 'Automation', deps: 'Dependencies',
}

export function groupLabel(g: string): string {
  return GROUP_LABELS[g] ?? g
}

export function buildGraph(input: GraphInput): RepoGraph {
  const { meta, files, topFolders, entryPoints, testFiles, configFiles, tech, manifestTexts, hasWorkflows, readmePath } = input
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const gh = (p: string) => `${meta.htmlUrl}/blob/${meta.defaultBranch}/${p}`
  const has = (pred: (f: FileInfo) => boolean) => files.some(pred)

  const addNode = (n: GraphNode) => { if (!nodes.some((x) => x.id === n.id)) nodes.push(n) }
  const addEdge = (source: string, target: string, kind: EdgeKind, label?: string) => {
    if (source !== target && nodes.some((n) => n.id === source) && nodes.some((n) => n.id === target) &&
      !edges.some((e) => e.source === source && e.target === target)) {
      edges.push({ source, target, kind, label })
    }
  }

  const indexHtml = files.find((f) => f.name.toLowerCase() === 'index.html' && f.dir === '')

  // Actor: the browser, only when the project serves a root page to it
  if (indexHtml) {
    addNode({ id: 'browser', label: 'Browser', kind: 'actor', group: 'external',
      purpose: 'The environment where the interface runs for visitors.',
      why: 'Everything the user sees starts as a request from here.', tech: ['HTML'], weight: 1 })
  }

  // Entry nodes
  const entryNodes = entryPoints.filter((f) => !f.name.endsWith('.json')).slice(0, 3)
  for (const f of entryNodes) {
    addNode({ id: `file:${f.path}`, label: f.name, kind: 'file', group: 'entry', path: f.path,
      purpose: entryPurpose(f), why: 'This is one of the first files executed or loaded, so the application flow begins here.',
      tech: [], weight: 2, htmlUrl: gh(f.path) })
    if (indexHtml && f !== indexHtml && f.path !== 'index.html') addEdge('browser', `file:${f.path}`, 'loads', 'loads')
  }
  if (indexHtml && !entryNodes.some((f) => f.path === indexHtml.path)) {
    addNode({ id: `file:${indexHtml.path}`, label: indexHtml.name, kind: 'file', group: 'entry', path: indexHtml.path,
      purpose: 'The HTML page that loads the application in a browser.', why: 'Browsers load this page first; it pulls in scripts and styles.',
      tech: ['HTML'], weight: 2, htmlUrl: gh(indexHtml.path) })
  }
  if (indexHtml) addEdge('browser', `file:${indexHtml.path}`, 'loads', 'loads')

  // Core folder
  const coreFolders = topFolders.filter((f) => ['src', 'app', 'lib', 'server', 'client', 'packages', 'apps'].includes(f.name.toLowerCase()) && !f.path.includes('/'))
  const core = coreFolders[0]
  if (core) {
    addNode({ id: `folder:${core.path}`, label: core.name, kind: 'folder', group: 'core', path: core.path,
      purpose: core.purpose, why: 'Most of the behavior of the project lives here.', tech: core.languages.slice(0, 2), weight: 3, htmlUrl: gh(core.path) })
  }

  // UI folders
  const uiFolders = topFolders.filter((f) => ['components', 'pages', 'views', 'ui', 'screens'].includes(f.name.toLowerCase()) && f.path !== core?.path).slice(0, 2)
  for (const f of uiFolders) {
    addNode({ id: `folder:${f.path}`, label: f.name, kind: 'folder', group: 'ui', path: f.path,
      purpose: f.purpose, why: 'These are the visible parts of the product that users interact with.', tech: f.languages.slice(0, 2), weight: 2, htmlUrl: gh(f.path) })
  }

  // Service-ish folders
  const serviceFolders = topFolders.filter((f) => ['services', 'api', 'server', 'backend', 'routes', 'controllers'].includes(f.name.toLowerCase()) && f.path !== core?.path).slice(0, 2)
  for (const f of serviceFolders) {
    addNode({ id: `folder:${f.path}`, label: f.name, kind: 'folder', group: 'services', path: f.path,
      purpose: f.purpose, why: 'This is where the project talks to data sources and external systems.', tech: f.languages.slice(0, 2), weight: 2, htmlUrl: gh(f.path) })
  }

  // Data folders
  const dataFolders = topFolders.filter((f) => ['data', 'db', 'database', 'models', 'assets', 'static', 'public', 'img', 'images', 'media'].includes(f.name.toLowerCase()) && f.path !== core?.path)
  for (const f of dataFolders.slice(0, 2)) {
    addNode({ id: `folder:${f.path}`, label: f.name, kind: 'folder', group: 'data', path: f.path,
      purpose: f.purpose, why: 'The application reads content and resources from here.', tech: [], weight: 1, htmlUrl: gh(f.path) })
  }

  // External API concept
  const apiClientTech = tech.filter((t) => ['Axios', 'Requests', 'OpenAI API', 'Stripe API', 'Firebase', 'Supabase'].includes(t.name))
  if (apiClientTech.length > 0) {
    addNode({ id: 'concept:external-api', label: 'External API', kind: 'concept', group: 'external',
      purpose: 'Third party services the application calls over the network.',
      why: `The project depends on ${apiClientTech.map((t) => t.name).join(', ')} to reach external data.`,
      tech: apiClientTech.map((t) => t.name), weight: 1 })
  }

  // Key dependencies from package.json
  if (manifestTexts['package.json']) {
    try {
      const pkg = JSON.parse(manifestTexts['package.json'])
      const deps = Object.keys(pkg.dependencies ?? {}).slice(0, 4)
      for (const d of deps) {
        addNode({ id: `dep:${d}`, label: d, kind: 'dependency', group: 'deps',
          purpose: `An external package the project depends on.`, why: 'Declared in package.json dependencies.', tech: [], weight: 1 })
      }
    } catch { /* ignore */ }
  }

  // Config nodes
  for (const f of configFiles.filter((c) => !c.name.startsWith('.github')).slice(0, 3)) {
    addNode({ id: `file:${f.path}`, label: f.name, kind: 'file', group: 'config', path: f.path,
      purpose: 'Configuration that shapes how tools and the application behave.', why: 'Changing this file changes build or runtime behavior without touching source code.',
      tech: [], weight: 1, htmlUrl: gh(f.path) })
  }

  // Tests
  if (testFiles.length > 0) {
    const testDir = testRootFolder(testFiles)
    const label = testDir ?? 'tests'
    addNode({ id: `tests:${label}`, label: label, kind: 'folder', group: 'tests', path: testDir ?? undefined,
      purpose: `Automated tests (${testFiles.length} files) that verify the project keeps working.`,
      why: 'Tests show expected behavior and catch regressions.', tech: [], weight: 2,
      htmlUrl: testDir ? gh(testDir) : undefined })
  }

  // Docs
  if (readmePath) {
    addNode({ id: `file:${readmePath}`, label: readmePath, kind: 'file', group: 'docs', path: readmePath,
      purpose: 'The main documentation file of the project.', why: 'It usually explains what the project is and how to run it.',
      tech: ['Markdown'], weight: 2, htmlUrl: gh(readmePath) })
  }
  const docsFolder = topFolders.find((f) => ['docs', 'documentation'].includes(f.name.toLowerCase()))
  if (docsFolder) {
    addNode({ id: `folder:${docsFolder.path}`, label: docsFolder.name, kind: 'folder', group: 'docs', path: docsFolder.path,
      purpose: docsFolder.purpose, why: 'Extended documentation for users and contributors.', tech: [], weight: 1, htmlUrl: gh(docsFolder.path) })
  }

  // CI
  if (hasWorkflows) {
    const wf = files.filter((f) => f.path.startsWith('.github/workflows/'))
    addNode({ id: 'ci:workflows', label: 'GitHub Actions', kind: 'folder', group: 'ci', path: '.github/workflows',
      purpose: `${wf.length} workflow ${wf.length === 1 ? 'file' : 'files'} that run automatically on GitHub.`,
      why: 'Automation here builds, tests, or deploys the project when code changes.', tech: ['GitHub Actions'], weight: 2,
      htmlUrl: gh('.github/workflows') })
  }

  // Edges: entry -> core -> ui -> services -> external
  const entryIds = nodes.filter((n) => n.group === 'entry').map((n) => n.id)
  const coreId = core ? `folder:${core.path}` : null
  for (const e of entryIds) {
    if (coreId) addEdge(e, coreId, 'loads', 'starts')
  }
  const uiIds = uiFolders.map((f) => `folder:${f.path}`)
  if (coreId) for (const u of uiIds) addEdge(coreId, u, 'renders', 'renders')
  else { // no core folder: entry connects straight to UI
    for (const e of entryIds) for (const u of uiIds) addEdge(e, u, 'renders', 'renders')
  }
  const serviceIds = serviceFolders.map((f) => `folder:${f.path}`)
  for (const u of [...uiIds, ...(coreId ? [coreId] : [])]) for (const s of serviceIds) addEdge(u, s, 'calls', 'calls')
  const dataIds = dataFolders.slice(0, 2).map((f) => `folder:${f.path}`)
  for (const d of dataIds) {
    const target = uiIds[0] ?? coreId ?? entryIds[0]
    if (target) addEdge(target, d, 'reads', 'reads')
  }
  for (const s of [...serviceIds, ...(uiIds.length === 0 && coreId ? [coreId] : [])]) {
    if (nodes.some((n) => n.id === 'concept:external-api')) addEdge(s, 'concept:external-api', 'calls', 'calls')
  }
  for (const n of nodes.filter((x) => x.group === 'deps')) {
    const target = coreId ?? entryIds[0]
    if (target) addEdge(target, n.id, 'uses', 'imports')
  }
  for (const n of nodes.filter((x) => x.group === 'config')) {
    const target = coreId ?? entryIds[0]
    if (target) addEdge(n.id, target, 'configures', 'configures')
  }
  const testsNode = nodes.find((n) => n.group === 'tests')
  if (testsNode) {
    const target = uiIds[0] ?? coreId ?? entryIds[0]
    if (target) addEdge(testsNode.id, target, 'tests', 'verifies')
  }
  if (nodes.some((n) => n.id === 'ci:workflows')) {
    const target = coreId ?? entryIds[0]
    if (target) addEdge('ci:workflows', target, 'publishes', 'builds')
  }

  return { nodes, edges }
}

function entryPurpose(f: FileInfo): string {
  const n = f.name.toLowerCase()
  if (n === 'index.html') return 'The HTML page that loads the application in a browser.'
  if (n.startsWith('main') || n.startsWith('index')) return 'The file where application execution begins.'
  if (n.startsWith('app')) return 'The file that assembles the main application.'
  if (n.startsWith('server')) return 'The file that starts the server.'
  if (n === 'manage.py') return 'The command line entry point of the Django project.'
  return 'An application entry point.'
}

// ---------- Deterministic layout ----------
// Groups map to columns; nodes stack vertically inside their column.
const COLUMNS: { groups: string[]; x: number }[] = [
  { groups: ['external'], x: 0 },      // actors + external services on the far left
  { groups: ['entry'], x: 260 },
  { groups: ['core'], x: 520 },
  { groups: ['ui'], x: 780 },
  { groups: ['services', 'data'], x: 1040 },
  { groups: ['deps'], x: 1300 },
]
const SIDE_X = 1300
const SIDE_GROUPS = ['config', 'tests', 'docs', 'ci']

export interface PositionedNode extends GraphNode { x: number; y: number }

export function layoutGraph(graph: RepoGraph): { nodes: PositionedNode[]; width: number; height: number } {
  const NODE_H = 74
  const GAP = 18
  const TOP = 40
  const positioned: PositionedNode[] = []

  // external column: actors first, then concepts
  const externals = [...graph.nodes.filter((n) => n.group === 'external' && n.kind === 'actor'),
    ...graph.nodes.filter((n) => n.group === 'external' && n.kind !== 'actor')]
  let y = TOP
  for (const n of externals) { positioned.push({ ...n, x: 0, y }); y += NODE_H + GAP }
  const maxMainY = y

  for (const col of COLUMNS.slice(1)) {
    let cy = TOP
    for (const n of graph.nodes.filter((x) => col.groups.includes(x.group))) {
      positioned.push({ ...n, x: col.x, y: cy })
      cy += NODE_H + GAP
    }
  }
  // side groups stacked in the last column area, pushed right
  let sy = maxMainY + 40
  for (const g of SIDE_GROUPS) {
    for (const n of graph.nodes.filter((x) => x.group === g)) {
      positioned.push({ ...n, x: SIDE_X, y: sy })
      sy += NODE_H + GAP
    }
  }
  // deps column may overlap side groups; shift side groups right if both exist
  const hasDeps = positioned.some((n) => n.group === 'deps')
  if (hasDeps) {
    for (const p of positioned) if (SIDE_GROUPS.includes(p.group)) p.x = SIDE_X + 260
  }

  const width = Math.max(...positioned.map((n) => n.x)) + 220
  const height = Math.max(...positioned.map((n) => n.y)) + NODE_H + TOP
  return { nodes: positioned, width, height }
}

export const NODE_SIZE = { w: 200, h: 74 }
