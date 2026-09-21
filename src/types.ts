export interface RepoMeta {
  owner: string
  name: string
  fullName: string
  description: string
  htmlUrl: string
  stars: number
  forks: number
  primaryLanguage: string | null
  sizeKb: number
  updatedAt: string
  license: string | null
  defaultBranch: string
  topics: string[]
  openIssues: number
}

export interface LanguageShare {
  language: string
  bytes: number
  percent: number
  color: string
}

export interface FileInfo {
  path: string
  name: string
  dir: string
  ext: string
  size: number
}

export interface FolderSummary {
  path: string
  name: string
  files: number
  bytes: number
  purpose: string
  languages: string[]
}

export type TechCategory = 'Language' | 'Framework' | 'Tooling' | 'Platform' | 'Library'

export interface TechItem {
  name: string
  category: TechCategory
  evidence: string
}

export interface Characteristic {
  label: string
  detail: string
}

export type HealthStatus = 'present' | 'notice' | 'absent'

export interface HealthRow {
  category: string
  status: HealthStatus
  observations: string[]
}

export type NodeKind = 'folder' | 'file' | 'concept' | 'actor' | 'dependency'
export type NodeGroup =
  | 'entry'
  | 'core'
  | 'ui'
  | 'services'
  | 'data'
  | 'external'
  | 'config'
  | 'tests'
  | 'docs'
  | 'ci'
  | 'deps'

export interface GraphNode {
  id: string
  label: string
  kind: NodeKind
  group: NodeGroup
  path?: string
  purpose: string
  why: string
  tech: string[]
  weight: number
  htmlUrl?: string
}

export type EdgeKind = 'loads' | 'renders' | 'calls' | 'reads' | 'tests' | 'configures' | 'uses' | 'publishes'

export interface GraphEdge {
  source: string
  target: string
  kind: EdgeKind
  label?: string
}

export interface RepoGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type GuideLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface GuideStep {
  path: string
  label: string
  role: string
  what: string
  why: string
  connects: string[]
  understandBefore: string
  level: GuideLevel
  htmlUrl?: string
}

export interface Identity {
  summary: string
  keywords: string[]
}

export interface Analysis {
  repo: RepoMeta
  languages: LanguageShare[]
  fileCount: number
  totalBytes: number
  identity: Identity
  tech: TechItem[]
  topFolders: FolderSummary[]
  characteristics: Characteristic[]
  health: HealthRow[]
  graph: RepoGraph
  guide: GuideStep[]
  importantFiles: FileInfo[]
  configFiles: FileInfo[]
  testFiles: FileInfo[]
  entryPoints: FileInfo[]
  readmePresent: boolean
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error'

export interface AnalysisStage {
  id: string
  label: string
  done: boolean
  active: boolean
}
