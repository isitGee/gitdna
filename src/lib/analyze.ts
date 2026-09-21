import type {
  Analysis, Characteristic, FileInfo, FolderSummary, HealthRow, Identity,
  LanguageShare, RepoMeta, TechItem,
} from '../types'
import { fetchLanguages, fetchRaw, fetchRepoMeta, fetchTree, GitHubError } from './github'
import { languageColor } from './format'
import { buildGraph } from './graph'
import { buildGuide } from './guide'

const EXT_TECH: Record<string, { name: string; category: TechItem['category'] }> = {
  ts: { name: 'TypeScript', category: 'Language' }, tsx: { name: 'TypeScript', category: 'Language' },
  js: { name: 'JavaScript', category: 'Language' }, jsx: { name: 'JavaScript', category: 'Language' },
  mjs: { name: 'JavaScript', category: 'Language' }, cjs: { name: 'JavaScript', category: 'Language' },
  py: { name: 'Python', category: 'Language' }, rb: { name: 'Ruby', category: 'Language' },
  go: { name: 'Go', category: 'Language' }, rs: { name: 'Rust', category: 'Language' },
  java: { name: 'Java', category: 'Language' }, kt: { name: 'Kotlin', category: 'Language' },
  cs: { name: 'C#', category: 'Language' }, cpp: { name: 'C++', category: 'Language' },
  cc: { name: 'C++', category: 'Language' }, c: { name: 'C', category: 'Language' },
  swift: { name: 'Swift', category: 'Language' }, php: { name: 'PHP', category: 'Language' },
  ex: { name: 'Elixir', category: 'Language' }, exs: { name: 'Elixir', category: 'Language' },
  lua: { name: 'Lua', category: 'Language' }, r: { name: 'R', category: 'Language' },
  zig: { name: 'Zig', category: 'Language' }, dart: { name: 'Dart', category: 'Language' },
  scala: { name: 'Scala', category: 'Language' }, sh: { name: 'Shell', category: 'Tooling' },
  ps1: { name: 'PowerShell', category: 'Tooling' },
  html: { name: 'HTML', category: 'Language' }, css: { name: 'CSS', category: 'Language' },
  scss: { name: 'SCSS', category: 'Language' }, vue: { name: 'Vue', category: 'Framework' },
  svelte: { name: 'Svelte', category: 'Framework' },
  ipynb: { name: 'Jupyter Notebook', category: 'Tooling' },
  sql: { name: 'SQL', category: 'Language' }, proto: { name: 'Protocol Buffers', category: 'Tooling' },
  gradle: { name: 'Gradle', category: 'Tooling' },
}

const MANIFEST_TECH: Record<string, { name: string; category: TechItem['category'] }> = {
  'package.json': { name: 'Node.js', category: 'Platform' },
  'requirements.txt': { name: 'Python', category: 'Language' },
  'pyproject.toml': { name: 'Python', category: 'Language' },
  'setup.py': { name: 'Python', category: 'Language' },
  'go.mod': { name: 'Go', category: 'Language' },
  'cargo.toml': { name: 'Rust', category: 'Language' },
  'gemfile': { name: 'Ruby', category: 'Language' },
  'composer.json': { name: 'PHP', category: 'Language' },
  'pom.xml': { name: 'Maven', category: 'Tooling' },
  'build.gradle': { name: 'Gradle', category: 'Tooling' },
  'dockerfile': { name: 'Docker', category: 'Tooling' },
  'docker-compose.yml': { name: 'Docker Compose', category: 'Tooling' },
  'docker-compose.yaml': { name: 'Docker Compose', category: 'Tooling' },
  'makefile': { name: 'Make', category: 'Tooling' },
  'cmakelists.txt': { name: 'CMake', category: 'Tooling' },
  'tsconfig.json': { name: 'TypeScript', category: 'Language' },
  'next.config.js': { name: 'Next.js', category: 'Framework' },
  'nuxt.config.js': { name: 'Nuxt', category: 'Framework' },
  'nuxt.config.ts': { name: 'Nuxt', category: 'Framework' },
  'vite.config.js': { name: 'Vite', category: 'Tooling' },
  'vite.config.ts': { name: 'Vite', category: 'Tooling' },
  'svelte.config.js': { name: 'SvelteKit', category: 'Framework' },
  'gatsby-config.js': { name: 'Gatsby', category: 'Framework' },
  'angular.json': { name: 'Angular', category: 'Framework' },
  'astro.config.mjs': { name: 'Astro', category: 'Framework' },
  'tailwind.config.js': { name: 'Tailwind CSS', category: 'Framework' },
  'tailwind.config.ts': { name: 'Tailwind CSS', category: 'Framework' },
  'webpack.config.js': { name: 'Webpack', category: 'Tooling' },
  'manage.py': { name: 'Django', category: 'Framework' },
  'pubspec.yaml': { name: 'Flutter', category: 'Framework' },
  'hardhat.config.js': { name: 'Hardhat', category: 'Tooling' },
  'truffle-config.js': { name: 'Truffle', category: 'Tooling' },
  '_config.yml': { name: 'Jekyll', category: 'Framework' },
  'mkdocs.yml': { name: 'MkDocs', category: 'Tooling' },
  'jest.config.js': { name: 'Jest', category: 'Tooling' },
  'jest.config.ts': { name: 'Jest', category: 'Tooling' },
  'vitest.config.ts': { name: 'Vitest', category: 'Tooling' },
  '.env.example': { name: 'Environment configuration', category: 'Tooling' },
}

const WELL_KNOWN_DEPS: Record<string, string> = {
  react: 'React', 'react-dom': 'React', 'vue': 'Vue', svelte: 'Svelte', '@angular/core': 'Angular',
  express: 'Express', fastify: 'Fastify', next: 'Next.js', nuxt: 'Nuxt', vite: 'Vite',
  webpack: 'Webpack', typescript: 'TypeScript', tailwindcss: 'Tailwind CSS', '@mui/material': 'Material UI',
  redux: 'Redux', zustand: 'Zustand', 'react-router-dom': 'React Router', axios: 'Axios',
  three: 'Three.js', d3: 'D3', 'chart.js': 'Chart.js', 'framer-motion': 'Framer Motion',
  '@testing-library/react': 'React Testing Library', jest: 'Jest', vitest: 'Vitest',
  mongoose: 'Mongoose', prisma: 'Prisma', sequelize: 'Sequelize', pg: 'PostgreSQL driver',
  mysql2: 'MySQL driver', redis: 'Redis client', socket: 'Socket.IO', 'socket.io': 'Socket.IO',
  stripe: 'Stripe API', openai: 'OpenAI API', firebase: 'Firebase', '@supabase/supabase-js': 'Supabase',
  flask: 'Flask', django: 'Django', pytest: 'pytest', numpy: 'NumPy', pandas: 'pandas',
  scikit: 'scikit learn', torch: 'PyTorch', tensorflow: 'TensorFlow', keras: 'Keras',
  requests: 'Requests', celery: 'Celery', sqlalchemy: 'SQLAlchemy', streamlit: 'Streamlit',
}

const FOLDER_PURPOSES: Record<string, string> = {
  src: "Contains the application's main source code.",
  app: 'Contains the application code and routing structure.',
  lib: 'Contains shared libraries and reusable logic.',
  components: 'Contains the interface components that build the user experience.',
  pages: 'Contains page level views of the application.',
  views: 'Contains page level views of the application.',
  services: 'Contains services that handle data access and external communication.',
  api: 'Contains API definitions or client code.',
  server: 'Contains server side application code.',
  client: 'Contains client side application code.',
  public: 'Contains static files served directly to visitors.',
  static: 'Contains static files served directly to visitors.',
  assets: 'Contains images, icons, fonts, and other static resources.',
  img: 'Contains images and graphics.',
  images: 'Contains images and graphics.',
  styles: 'Contains stylesheets that define the visual design.',
  css: 'Contains stylesheets that define the visual design.',
  scss: 'Contains SCSS stylesheets.',
  data: 'Contains structured data files used by the application.',
  db: 'Contains database schemas, migrations, or seed data.',
  database: 'Contains database schemas and migrations.',
  migrations: 'Contains database migration files.',
  docs: 'Contains project documentation.',
  documentation: 'Contains project documentation.',
  examples: 'Contains usage examples.',
  example: 'Contains usage examples.',
  demo: 'Contains demonstration material.',
  test: 'Contains automated tests.',
  tests: 'Contains automated tests.',
  __tests__: 'Contains automated tests.',
  spec: 'Contains test specifications.',
  scripts: 'Contains utility and automation scripts.',
  bin: 'Contains executable entry scripts.',
  tools: 'Contains internal development tools.',
  utils: 'Contains small helper functions used across the project.',
  helpers: 'Contains small helper functions used across the project.',
  hooks: 'Contains reusable state hooks.',
  store: 'Contains application state management.',
  models: 'Contains data models.',
  types: 'Contains type definitions.',
  config: 'Contains configuration files.',
  build: 'Contains build output or build scripts.',
  dist: 'Contains packaged distribution files.',
  locales: 'Contains translation files.',
  i18n: 'Contains internationalization resources.',
  docs_site: 'Contains the documentation website source.',
  website: 'Contains the project website source.',
  workflows: 'Contains CI workflow definitions.',
  '.github': 'Contains GitHub configuration such as workflows, issue templates, and automation.',
  '.vscode': 'Contains shared editor settings for the team.',
}

function purposeFor(folder: string, files: FileInfo[]): string {
  const base = folder.split('/').pop()!.toLowerCase()
  if (FOLDER_PURPOSES[base]) return FOLDER_PURPOSES[base]
  const sub = files.filter((f) => f.dir === folder || f.dir.startsWith(folder + '/'))
  const exts = countBy(sub, (f) => f.ext).slice(0, 2).map(([e]) => e).filter(Boolean)
  if (exts.length) {
    const names = exts.map((e) => EXT_TECH[e]?.name ?? e.toUpperCase())
    return `Contains ${names.join(' and ')} files (${sub.length} ${sub.length === 1 ? 'file' : 'files'}).`
  }
  return `Contains ${sub.length} project ${sub.length === 1 ? 'file' : 'files'}.`
}

export function countBy<T>(items: T[], key: (t: T) => string): [string, number][] {
  const m = new Map<string, number>()
  for (const it of items) {
    const k = key(it)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

/** Most common top level folder holding tests, ignoring dot folders when possible. */
export function testRootFolder(testFiles: FileInfo[]): string | null {
  const roots = testFiles.map((f) => f.dir.split('/').filter(Boolean)[0] ?? '').filter(Boolean)
  if (roots.length === 0) return null
  const counts = new Map<string, number>()
  for (const r of roots) counts.set(r, (counts.get(r) ?? 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const meaningful = ranked.find(([r]) => !r.startsWith('.'))
  return (meaningful ?? ranked[0])[0]
}

export function isTestFile(f: FileInfo): boolean {
  const n = f.name.toLowerCase()
  return /\.(test|spec)\.[^.]+$/.test(n) || /^test_.*\.py$/.test(n) ||
    f.dir.split('/').some((p) => ['test', 'tests', '__tests__', 'spec'].includes(p.toLowerCase()))
}

export function isConfigFile(f: FileInfo): boolean {
  const n = f.name.toLowerCase()
  return (
    n.endsWith('.json') && !n.includes('package-lock') && f.dir.split('/').length <= 1 && /config|rc$/.test(n) ||
    n.endsWith('.yml') || n.endsWith('.yaml') || n.endsWith('.toml') || n.endsWith('.ini') ||
    n === '.env.example' || n === 'dockerfile' || n === 'makefile'
  ) && f.dir.split('/').filter(Boolean).length <= 2
}

const KNOWN_SUBFOLDERS = ['components', 'services', 'api', 'pages', 'views', 'data', 'utils', 'hooks', 'store', 'models', 'lib', 'ui', 'screens']

/** Top level folders plus well known nested folders (e.g. src/components) that matter architecturally. */
export function detectKnownFolders(files: FileInfo[], topFolders: FolderSummary[]): FolderSummary[] {
  const result = [...topFolders]
  const coreDirs = topFolders.filter((f) => ['src', 'app', 'lib', 'client', 'server'].includes(f.name.toLowerCase())).map((f) => f.path)
  for (const core of coreDirs) {
    for (const sub of KNOWN_SUBFOLDERS) {
      const path = `${core}/${sub}`
      const subFiles = files.filter((f) => f.dir === path || f.dir.startsWith(path + '/'))
      if (subFiles.length >= 2 && !result.some((r) => r.path === path)) {
        const bytes = subFiles.reduce((sum, f) => sum + f.size, 0)
        const langs = countBy(subFiles, (f) => EXT_TECH[f.ext]?.name ?? '').filter(([n]) => n).slice(0, 3).map(([n]) => n)
        result.push({ path, name: sub, files: subFiles.length, bytes, purpose: purposeFor(path, files), languages: langs })
      }
    }
  }
  return result
}

const ENTRY_PATTERNS = [
  /^src\/(main|index|app|server)\.(ts|tsx|js|jsx|mjs)$/i,
  /^(main|index|app|server|manage|cli)\.(py|go|rs|rb|js|ts)$/i,
  /^cmd\/[^/]+\/main\.go$/i,
  /^index\.html$/i,
  /^package\.json$/i,
]

export function findEntryPoints(files: FileInfo[]): FileInfo[] {
  const hits = files.filter((f) => ENTRY_PATTERNS.some((p) => p.test(f.path)))
  // Code entry points first; the HTML shell comes last because it is a container, not logic.
  const order = (f: FileInfo) => {
    const n = f.name.toLowerCase()
    if (n === 'package.json') return 4
    if (n === 'index.html') return 3
    if (/^(main|index)\b/.test(n)) return 0
    if (/^app\b/.test(n)) return 1
    if (/^server\b/.test(n)) return 1
    return 2
  }
  return hits.sort((a, b) => order(a) - order(b) || a.path.length - b.path.length).slice(0, 5)
}

export function detectFrameworksFromPackageJson(text: string): { frameworks: TechItem[]; deps: [string, string][] } {
  const frameworks: TechItem[] = []
  const deps: [string, string][] = []
  try {
    const pkg = JSON.parse(text)
    const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
    for (const [dep] of Object.entries(all)) {
      const known = WELL_KNOWN_DEPS[dep]
      if (known) {
        deps.push([dep, known])
        const cat: TechItem['category'] =
          ['React', 'Vue', 'Svelte', 'Angular', 'Next.js', 'Nuxt', 'Express', 'Fastify', 'Astro', 'Flask', 'Django'].includes(known)
            ? 'Framework' : 'Library'
        if (!frameworks.some((t) => t.name === known)) {
          frameworks.push({ name: known, category: cat, evidence: `Listed in package.json as ${dep}` })
        }
      }
    }
  } catch { /* ignore malformed manifests */ }
  return { frameworks, deps }
}

export interface AnalyzeProgress {
  (stage: number): void
}

export async function analyzeRepository(owner: string, name: string, onStage: AnalyzeProgress): Promise<Analysis> {
  onStage(0) // Connecting to GitHub
  const meta = await fetchRepoMeta(owner, name)

  onStage(1) // Reading repository structure
  const [tree, languagesRaw] = await Promise.all([
    fetchTree(owner, name, meta.defaultBranch),
    fetchLanguages(owner, name),
  ])
  if (tree.files.length === 0) {
    throw new GitHubError('empty', 'This repository has no files on its default branch.')
  }
  if (meta.sizeKb > 300_000 || tree.truncated) {
    // still analyzable from partial tree; flag via characteristic later
  }

  onStage(2) // Analyzing technologies
  const manifests = ['package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'composer.json', 'Gemfile']
    .filter((m) => tree.files.some((f) => f.path.toLowerCase() === m))
  const manifestTexts: Record<string, string> = {}
  await Promise.all(
    manifests.slice(0, 3).map(async (m) => {
      const text = await fetchRaw(owner, name, meta.defaultBranch, m)
      if (text) manifestTexts[m] = text
    }),
  )

  const tech = new Map<string, TechItem>()
  const addTech = (t: TechItem) => {
    const key = t.name.toLowerCase()
    if (!tech.has(key)) tech.set(key, t)
  }
  const extCounts = countBy(tree.files, (x) => x.ext)
  const extCountMap = new Map(extCounts)
  for (const f of tree.files) {
    const t = EXT_TECH[f.ext]
    if (t) addTech({ ...t, evidence: `${extCountMap.get(f.ext) ?? 0} files use this` })
    const mt = MANIFEST_TECH[f.name.toLowerCase()]
    if (mt && f.dir.split('/').filter(Boolean).length <= 1) addTech({ ...mt, evidence: `Detected from ${f.path}` })
  }
  if (manifestTexts['package.json']) {
    const { frameworks } = detectFrameworksFromPackageJson(manifestTexts['package.json'])
    frameworks.forEach(addTech)
  }
  if (manifestTexts['requirements.txt']) {
    for (const line of manifestTexts['requirements.txt'].split('\n')) {
      const pkg = line.split(/[=<>!~\[]/)[0].trim().toLowerCase()
      const known = WELL_KNOWN_DEPS[pkg]
      if (known) addTech({ name: known, category: /flask|django/.test(pkg) ? 'Framework' : 'Library', evidence: `Listed in requirements.txt` })
    }
  }
  if (manifestTexts['pyproject.toml'] && /poetry|hatch|setuptools|pdm/.test(manifestTexts['pyproject.toml'])) {
    addTech({ name: 'Python packaging', category: 'Tooling', evidence: 'Detected from pyproject.toml' })
  }
  const hasWorkflows = tree.files.some((f) => f.path.startsWith('.github/workflows/'))
  if (hasWorkflows) addTech({ name: 'GitHub Actions', category: 'Platform', evidence: 'Workflow files found in .github/workflows' })
  if (tree.files.some((f) => f.name.toLowerCase() === 'cname')) addTech({ name: 'GitHub Pages', category: 'Platform', evidence: 'CNAME file detected' })
  if (tree.files.some((f) => f.path.toLowerCase() === 'index.html') && !manifestTexts['package.json']) {
    addTech({ name: 'Static site', category: 'Platform', evidence: 'Root index.html without a build manifest' })
  }
  // languages as tech too (top 4)
  const langEntries = Object.entries(languagesRaw).sort((a, b) => b[1] - a[1])
  const totalLangBytes = langEntries.reduce((s, [, b]) => s + b, 0) || 1

  onStage(3) // Mapping relationships
  const languages: LanguageShare[] = langEntries.slice(0, 8).map(([language, bytes]) => ({
    language, bytes,
    percent: Math.round((bytes / totalLangBytes) * 1000) / 10,
    color: languageColor(language),
  }))

  // top level folders
  const rootFolders = countBy(tree.files.filter((f) => f.dir !== ''), (f) => f.dir.split('/')[0])
    .filter(([dir]) => !dir.startsWith('.') || dir === '.github')
    .slice(0, 9)
  const topFolders: FolderSummary[] = rootFolders.map(([dir, count]) => {
    const files = tree.files.filter((f) => f.dir === dir || f.dir.startsWith(dir + '/'))
    const bytes = files.reduce((s, f) => s + f.size, 0)
    const langs = countBy(files, (f) => EXT_TECH[f.ext]?.name ?? '').filter(([n]) => n).slice(0, 3).map(([n]) => n)
    return { path: dir, name: dir, files: count, bytes, purpose: purposeFor(dir, tree.files), languages: langs }
  })

  const testFiles = tree.files.filter(isTestFile).slice(0, 40)
  const configFiles = tree.files.filter(isConfigFile).slice(0, 20)
  const entryPoints = findEntryPoints(tree.files)
  const readme = tree.files.find((f) => /^readme(\.[a-z]+)?$/i.test(f.name) && f.dir === '')
  const readmePresent = Boolean(readme)

  const characteristics: Characteristic[] = []
  if (manifestTexts['package.json'] || tree.files.some((f) => f.path === 'package.json')) {
    characteristics.push({ label: 'Node.js project', detail: 'A package.json manifest defines the project dependencies.' })
  }
  if (languages.some((l) => ['HTML', 'CSS'].includes(l.language)) && tree.files.some((f) => f.path === 'index.html')) {
    characteristics.push({ label: 'Runs in a browser', detail: 'An index.html page exists at the repository root.' })
  }
  if (!manifestTexts['package.json'] && tree.files.some((f) => f.path.toLowerCase() === 'index.html')) {
    characteristics.push({ label: 'Static application', detail: 'No JavaScript build manifest detected; the site appears to be served as static files.' })
  }
  if (testFiles.length > 0) {
    characteristics.push({ label: 'Contains tests', detail: `${testFiles.length} test ${testFiles.length === 1 ? 'file' : 'files'} detected.` })
  }
  if (readmePresent) {
    characteristics.push({ label: 'Contains documentation', detail: 'A README file documents the project at the root.' })
  }
  if (hasWorkflows) {
    characteristics.push({ label: 'Has automated deployment', detail: 'GitHub Actions workflows are configured in .github/workflows.' })
  }
  if (tree.files.some((f) => f.name.toLowerCase() === 'dockerfile')) {
    characteristics.push({ label: 'Containerized', detail: 'A Dockerfile defines how the application is packaged.' })
  }
  const CLIENT_LIBS = ['axios', 'node-fetch', 'got', 'ky', 'openai', 'stripe', 'firebase', '@supabase/supabase-js', 'requests', 'httpx', 'urllib3']
  const usesClients = CLIENT_LIBS.some((lib) =>
    (manifestTexts['package.json']?.includes(`"${lib}"`) ?? false) ||
    (manifestTexts['requirements.txt']?.split('\n').some((l) => l.split(/[=<>!~\[]/)[0].trim().toLowerCase() === lib) ?? false))
  if (usesClients) {
    characteristics.push({ label: 'Uses external services', detail: 'A network or API client library appears in the project dependencies.' })
  }
  if (meta.license) characteristics.push({ label: 'Licensed', detail: `Released under the ${meta.license} license.` })
  if (tree.truncated) characteristics.push({ label: 'Very large repository', detail: 'The file tree was partially read; the analysis covers the first thousands of files.' })

  const health: HealthRow[] = [
    {
      category: 'Documentation',
      status: readmePresent ? 'present' : 'absent',
      observations: readmePresent
        ? ['README detected at the repository root', ...(tree.files.some((f) => f.dir === 'docs') ? ['A docs folder provides extended documentation'] : [])]
        : ['No README file was found at the repository root'],
    },
    {
      category: 'Testing',
      status: testFiles.length > 0 ? 'present' : 'notice',
      observations: testFiles.length > 0
        ? [`Test files detected (${testFiles.length})`, ...[...new Set(testFiles.map((f) => f.dir.split('/')[0]).filter(Boolean))].slice(0, 2).map((d) => `Tests live under ${d}/`)]
        : ['No test files were detected in the repository'],
    },
    {
      category: 'Dependencies',
      status: manifests.length > 0 ? 'present' : 'notice',
      observations: manifests.length > 0
        ? [`Package manifest detected (${manifests[0]})`]
        : ['No package manifest was found'],
    },
    {
      category: 'Configuration',
      status: configFiles.length > 0 ? 'present' : 'notice',
      observations: configFiles.length > 0
        ? configFiles.slice(0, 3).map((f) => `${f.path} detected`)
        : ['No dedicated configuration files were detected'],
    },
    {
      category: 'Structure',
      status: topFolders.length > 0 ? 'present' : 'notice',
      observations: topFolders.length > 0
        ? [`${tree.files.length} files organized into ${rootFolders.length} top level folders`]
        : ['All files live at the repository root'],
    },
    {
      category: 'Deployment',
      status: hasWorkflows ? 'present' : 'absent',
      observations: hasWorkflows
        ? tree.files.filter((f) => f.path.startsWith('.github/workflows/')).slice(0, 2).map((f) => `${f.path} workflow detected`)
        : ['No CI workflow files were detected'],
    },
  ]

  onStage(4) // Identifying important files
  const importantFiles = scoreImportantFiles(tree.files, readme, entryPoints, configFiles, testFiles).slice(0, 12)

  const identity = buildIdentity(meta, tech, languages, tree.files, manifestTexts, readmePresent, tree)

  onStage(5) // Building repository DNA
  const knownFolders = detectKnownFolders(tree.files, topFolders)
  const graph = buildGraph({ meta, files: tree.files, topFolders: knownFolders, entryPoints, testFiles, configFiles, tech: [...tech.values()], manifestTexts, hasWorkflows, readmePath: readme?.path })
  const guide = buildGuide({ meta, files: tree.files, readme, entryPoints, topFolders: knownFolders, testFiles, configFiles })

  return {
    repo: meta,
    languages,
    fileCount: tree.files.length,
    totalBytes: tree.files.reduce((s, f) => s + f.size, 0),
    identity,
    tech: rankTech([...tech.values()], languages),
    topFolders,
    characteristics,
    health,
    graph,
    guide,
    importantFiles,
    configFiles,
    testFiles,
    entryPoints,
    readmePresent,
  }
}

function rankTech(tech: TechItem[], languages: LanguageShare[]): TechItem[] {
  const order: Record<TechItem['category'], number> = { Language: 0, Framework: 1, Platform: 2, Library: 3, Tooling: 4 }
  return tech.sort((a, b) => order[a.category] - order[b.category] || a.name.localeCompare(b.name))
}

function scoreImportantFiles(
  files: FileInfo[],
  readme: FileInfo | undefined,
  entryPoints: FileInfo[],
  configFiles: FileInfo[],
  testFiles: FileInfo[],
): FileInfo[] {
  const set = new Set<FileInfo>()
  if (readme) set.add(readme)
  entryPoints.forEach((f) => set.add(f))
  const bySize = [...files].filter((f) => !isTestFile(f) && f.ext && !f.name.startsWith('.')).sort((a, b) => b.size - a.size)
  bySize.slice(0, 8).forEach((f) => set.add(f))
  configFiles.slice(0, 3).forEach((f) => set.add(f))
  return [...set]
}

function buildIdentity(
  meta: RepoMeta, tech: Map<string, TechItem>, languages: LanguageShare[],
  files: FileInfo[], manifestTexts: Record<string, string>, readmePresent: boolean, tree: { truncated: boolean },
): Identity {
  const frameworks = [...tech.values()].filter((t) => t.category === 'Framework').map((t) => t.name)
  const topLangs = languages.slice(0, 2).map((l) => l.language)
  const hasIndexHtml = files.some((f) => f.name === 'index.html')
  const isStatic = hasIndexHtml && !manifestTexts['package.json']
  const kind = frameworks.length > 0
    ? `a ${frameworks[0]} application`
    : isStatic ? 'a static web project'
    : topLangs.length ? `a ${topLangs.join(' and ')} project`
    : 'a software project'
  const structure = meta.description
    ? meta.description.replace(/[.!?]+$/, '')
    : 'an open source repository'
  const summary = `${meta.name} is ${structure}. It is built as ${kind}${frameworks.length > 0 && topLangs.length ? ` written primarily in ${topLangs.join(' and ')}` : ''} and contains ${files.length} files.`
  const keywords = [...new Set([...topLangs, ...frameworks, meta.license ?? ''].filter(Boolean))]
  return { summary, keywords }
}
