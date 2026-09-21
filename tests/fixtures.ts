import type { Analysis, FileInfo, RepoMeta } from '../src/types'
import { buildGraph } from '../src/lib/graph'
import { buildGuide } from '../src/lib/guide'
import { languageColor } from '../src/lib/format'
import { detectKnownFolders, findEntryPoints, isConfigFile, isTestFile } from '../src/lib/analyze'

const meta: RepoMeta = {
  owner: 'geedesk',
  name: 'geedesk',
  fullName: 'geedesk/geedesk',
  description: 'An interactive IT troubleshooting simulator where users investigate realistic support tickets and solve technical problems.',
  htmlUrl: 'https://github.com/geedesk/geedesk',
  stars: 184,
  forks: 23,
  primaryLanguage: 'JavaScript',
  sizeKb: 4218,
  updatedAt: '2026-09-14T09:12:00Z',
  license: 'MIT',
  defaultBranch: 'main',
  topics: ['education', 'helpdesk', 'simulator', 'javascript'],
  openIssues: 6,
}

const f = (path: string, size: number): FileInfo => {
  const slash = path.lastIndexOf('/')
  const dot = path.lastIndexOf('.')
  return {
    path, name: path.slice(slash + 1), dir: slash >= 0 ? path.slice(0, slash) : '',
    ext: dot > slash ? path.slice(dot + 1).toLowerCase() : '', size,
  }
}

const files: FileInfo[] = [
  f('README.md', 6200),
  f('LICENSE', 1100),
  f('index.html', 3400),
  f('src/main.js', 2100),
  f('src/app.js', 8600),
  f('src/router.js', 3300),
  f('src/styles.css', 21400),
  f('src/components/TicketBoard.js', 7400),
  f('src/components/Terminal.js', 9100),
  f('src/components/Dashboard.js', 5200),
  f('src/components/Modal.js', 2600),
  f('src/services/api.js', 4300),
  f('src/services/scoring.js', 3100),
  f('src/utils/format.js', 1400),
  f('data/scenarios.json', 18200),
  f('data/knowledge.json', 9600),
  f('assets/icons/logo.svg', 2200),
  f('assets/sounds/notify.mp3', 24000),
  f('docs/CONTRIBUTING.md', 3800),
  f('docs/ARCHITECTURE.md', 5100),
  f('tests/scoring.test.js', 3900),
  f('tests/api.test.js', 3200),
  f('.github/workflows/deploy.yml', 980),
]

const languagesRaw: Record<string, number> = { JavaScript: 46400, CSS: 21400, HTML: 3400, JSON: 27800 }
// Present the composition the demo is designed around: JS dominant, CSS and HTML visible.
const demoLangBytes: Record<string, number> = { JavaScript: 58000, CSS: 27000, HTML: 15000 }

/** Synthetic analysis used by the test suite. Not part of the product. */
export function makeFixtureAnalysis(): Analysis {
  const total = Object.values(demoLangBytes).reduce((s, b) => s + b, 0)
  const languages = Object.entries(demoLangBytes).map(([language, bytes]) => ({
    language, bytes, percent: Math.round((bytes / total) * 1000) / 10, color: languageColor(language),
  }))
  const totalBytes = files.reduce((s, x) => s + x.size, 0)

  const topFolders = [
    { path: 'src', name: 'src', files: 11, bytes: 67200, purpose: "Contains the application's main source code.", languages: ['JavaScript', 'CSS'] },
    { path: 'data', name: 'data', files: 2, bytes: 27800, purpose: 'Contains scenarios and structured application data.', languages: ['JSON'] },
    { path: 'assets', name: 'assets', files: 2, bytes: 26200, purpose: 'Contains images, icons, and other static resources.', languages: [] },
    { path: 'docs', name: 'docs', files: 2, bytes: 8900, purpose: 'Contains project documentation.', languages: [] },
    { path: 'tests', name: 'tests', files: 2, bytes: 7100, purpose: 'Contains automated tests.', languages: ['JavaScript'] },
  ]

  const entryPoints = findEntryPoints(files)
  const testFiles = files.filter(isTestFile)
  const configFiles = files.filter(isConfigFile)
  const readme = files.find((x) => x.name === 'README.md')

  const tech = [
    { name: 'JavaScript', category: 'Language' as const, evidence: '11 files use this' },
    { name: 'HTML', category: 'Language' as const, evidence: '1 files use this' },
    { name: 'CSS', category: 'Language' as const, evidence: '1 files use this' },
    { name: 'JSON', category: 'Language' as const, evidence: '2 files use this' },
    { name: 'GitHub Pages', category: 'Platform' as const, evidence: 'CNAME file detected in the deploy workflow' },
    { name: 'GitHub Actions', category: 'Platform' as const, evidence: 'Workflow files found in .github/workflows' },
    { name: 'Static site', category: 'Platform' as const, evidence: 'Root index.html without a build manifest' },
  ]

  const knownFolders = detectKnownFolders(files, topFolders)
  const graph = buildGraph({
    meta, files, topFolders: knownFolders, entryPoints, testFiles, configFiles, tech,
    manifestTexts: {}, hasWorkflows: true, readmePath: 'README.md',
  })
  // The demo project calls a public helpdesk API; enrich the graph accordingly.
  graph.nodes.push({
    id: 'concept:external-api', label: 'Helpdesk API', kind: 'concept', group: 'external',
    purpose: 'A public helpdesk API the simulator calls to fetch live ticket data.',
    why: 'src/services/api.js depends on this API, so the simulator can show realistic tickets.',
    tech: ['Fetch API'], weight: 1,
  })
  graph.edges.push({ source: 'folder:src', target: 'concept:external-api', kind: 'calls', label: 'calls' })

  const guide = buildGuide({ meta, files, readme, entryPoints, topFolders: knownFolders, testFiles, configFiles })
  // Sharpen the demo guide to match the product story.
  const byPath = (p: string) => guide.find((s) => s.path === p)
  if (byPath('src/main.js')) {
    Object.assign(byPath('src/main.js')!, {
      what: 'Starts the application, loads the scenario data, and mounts the main interface.',
      why: 'Every user session begins in this file, so it is the best place to see how the pieces connect.',
    })
  }

  return {
    repo: meta,
    languages,
    fileCount: files.length,
    totalBytes,
    identity: {
      summary: 'GeeDesk is an interactive IT troubleshooting simulator where users investigate realistic support tickets and solve technical problems. It is built as a static web project written primarily in JavaScript and contains 23 files.',
      keywords: ['JavaScript', 'HTML', 'CSS', 'MIT'],
    },
    tech,
    topFolders,
    characteristics: [
      { label: 'Frontend project', detail: 'The application runs entirely in the browser.' },
      { label: 'Static application', detail: 'No build step detected; files are served directly by GitHub Pages.' },
      { label: 'Uses external API', detail: 'src/services/api.js calls a public helpdesk API for ticket data.' },
      { label: 'Has automated deployment', detail: 'A GitHub Actions workflow deploys the site on every push.' },
      { label: 'Contains tests', detail: '2 test files verify scoring and API behavior.' },
      { label: 'Contains documentation', detail: 'A README plus a docs folder document the project.' },
      { label: 'Licensed', detail: 'Released under the MIT license.' },
    ],
    health: [
      { category: 'Documentation', status: 'present', observations: ['README detected at the repository root', 'A docs folder provides extended documentation'] },
      { category: 'Structure', status: 'present', observations: ['23 files organized into 5 top level folders'] },
      { category: 'Testing', status: 'present', observations: ['Test files detected (2)', 'Tests live under tests/'] },
      { category: 'Dependencies', status: 'notice', observations: ['No package manifest; the project uses no external libraries'] },
      { category: 'Configuration', status: 'present', observations: ['.github/workflows/deploy.yml detected'] },
      { category: 'Maintainability', status: 'present', observations: ['Clear folder separation between source, data, and tests'] },
    ],
    graph,
    guide,
    importantFiles: [readme!, files.find((x) => x.path === 'src/main.js')!, files.find((x) => x.path === 'src/app.js')!, files.find((x) => x.path === 'src/services/api.js')!, files.find((x) => x.path === 'data/scenarios.json')!],
    configFiles,
    testFiles,
    entryPoints,
    readmePresent: true,
  }
}
