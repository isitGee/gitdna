import type { FileInfo, FolderSummary, GuideLevel, GuideStep, RepoMeta } from '../types'
import { testRootFolder } from './analyze'

export interface GuideInput {
  meta: RepoMeta
  files: FileInfo[]
  readme?: FileInfo
  entryPoints: FileInfo[]
  topFolders: FolderSummary[]
  testFiles: FileInfo[]
  configFiles: FileInfo[]
}

export function buildGuide(input: GuideInput): GuideStep[] {
  const { meta, readme, entryPoints, topFolders, testFiles } = input
  const gh = (p: string) => `${meta.htmlUrl}/blob/${meta.defaultBranch}/${p}`
  const steps: GuideStep[] = []

  if (readme) {
    steps.push({
      path: readme.path, label: readme.name, role: 'Start here',
      what: 'Introduces the project, explains what it does, and usually shows how to install and run it.',
      why: 'This is the fastest way to understand the purpose of the project before reading any code.',
      connects: entryPoints.length ? [entryPoints[0].path] : topFolders.slice(0, 1).map((f) => f.path),
      understandBefore: 'What problem the project solves and who it is for.',
      level: 'Beginner', htmlUrl: gh(readme.path),
    })
  }

  const entry = entryPoints.find((f) => !f.name.endsWith('.json'))
  if (entry) {
    steps.push({
      path: entry.path, label: entry.path, role: 'Application entry point',
      what: 'This file is one of the first to run. It starts the application and connects the main interface to the rest of the project.',
      why: 'Most of the application flow begins here, so understanding this file makes the rest of the project easier to follow.',
      connects: topFolders.slice(0, 2).map((f) => f.path),
      understandBefore: 'How the project starts and what it sets up on launch.',
      level: 'Beginner', htmlUrl: gh(entry.path),
    })
  }

  const core = topFolders.find((f) => ['src', 'app', 'lib', 'server', 'client', 'packages', 'apps'].includes(f.name.toLowerCase()) && !f.path.includes('/'))
  if (core) {
    steps.push({
      path: core.path, label: core.path, role: 'Main source folder',
      what: core.purpose,
      why: 'Nearly every feature of the project is implemented inside this folder.',
      connects: topFolders.filter((f) => f !== core).slice(0, 3).map((f) => f.path),
      understandBefore: 'The general layout of the folder: which subfolders hold components, logic, and data.',
      level: 'Intermediate', htmlUrl: gh(core.path),
    })
  }

  const ui = topFolders.find((f) => ['components', 'pages', 'views', 'ui', 'screens'].includes(f.name.toLowerCase()) && f.path !== core?.path)
  if (ui) {
    steps.push({
      path: ui.path, label: ui.path, role: 'Interface building blocks',
      what: ui.purpose,
      why: 'These files define what users see and interact with, so they are the most concrete part of the product.',
      connects: [core?.path, topFolders.find((f) => ['services', 'api'].includes(f.name.toLowerCase()))?.path].filter(Boolean) as string[],
      understandBefore: 'How one component is structured and how it receives data.',
      level: 'Intermediate', htmlUrl: gh(ui.path),
    })
  }

  const services = topFolders.find((f) => ['services', 'api', 'server', 'routes', 'controllers', 'backend'].includes(f.name.toLowerCase()) && f.path !== core?.path)
  if (services) {
    steps.push({
      path: services.path, label: services.path, role: 'Data and external communication',
      what: services.purpose,
      why: 'This is where the project fetches, transforms, and stores data, which is often the most important business logic.',
      connects: [core?.path].filter(Boolean) as string[],
      understandBefore: 'Where data comes from and how it reaches the interface.',
      level: 'Intermediate', htmlUrl: gh(services.path),
    })
  }

  const data = topFolders.find((f) => ['data', 'db', 'database', 'models'].includes(f.name.toLowerCase()) && f.path !== core?.path)
  if (data) {
    steps.push({
      path: data.path, label: data.path, role: 'Structured data',
      what: data.purpose,
      why: 'Looking at the real data shapes makes the rest of the code much easier to reason about.',
      connects: [services?.path ?? core?.path].filter(Boolean) as string[],
      understandBefore: 'What shape the core data takes.',
      level: 'Beginner', htmlUrl: gh(data.path),
    })
  }

  if (testFiles.length > 0) {
    let testRoot = testRootFolder(testFiles) ?? testFiles[0].path
    if (testRoot === core?.path) {
      // tests live inside the core folder; point at the directory that actually holds them
      const dirs = new Map<string, number>()
      for (const f of testFiles) dirs.set(f.dir, (dirs.get(f.dir) ?? 0) + 1)
      testRoot = [...dirs.entries()].sort((a, b) => b[1] - a[1])[0][0] || testRoot
    }
    steps.push({
      path: testRoot, label: testRoot, role: 'Tests',
      what: `Automated tests (${testFiles.length} files) that describe and verify expected behavior.`,
      why: 'Tests double as executable documentation: they show exactly how code is meant to be used.',
      connects: [core?.path ?? ui?.path].filter(Boolean) as string[],
      understandBefore: 'How to run the test suite locally.',
      level: 'Advanced', htmlUrl: gh(testRoot),
    })
  }

  return steps
}
