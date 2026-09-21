import type { FileInfo, RepoMeta } from '../types'

const API = 'https://api.github.com'
const RAW = 'https://raw.githubusercontent.com'

export class GitHubError extends Error {
  kind: 'notFound' | 'rateLimit' | 'empty' | 'tooLarge' | 'network' | 'unknown'
  constructor(kind: GitHubError['kind'], message: string) {
    super(message)
    this.kind = kind
  }
}

async function gh<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
  } catch {
    throw new GitHubError('network', 'Could not reach the GitHub API.')
  }
  if (res.status === 404) throw new GitHubError('notFound', 'Repository not found.')
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (remaining === '0') throw new GitHubError('rateLimit', 'GitHub API rate limit reached.')
  }
  if (!res.ok) throw new GitHubError('unknown', `GitHub responded with status ${res.status}.`)
  return res.json() as Promise<T>
}

interface GhRepo {
  owner: { login: string }
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  size: number
  updated_at: string
  pushed_at: string
  license: { spdx_id: string; name: string } | null
  default_branch: string
  topics?: string[]
  open_issues_count: number
}

interface GhTreeEntry {
  path: string
  type: 'blob' | 'tree'
  size?: number
}

interface GhTree {
  tree: GhTreeEntry[]
  truncated: boolean
}

export async function fetchRepoMeta(owner: string, name: string): Promise<RepoMeta> {
  const r = await gh<GhRepo>(`/repos/${owner}/${name}`)
  if (r.size === 0) {
    // repo exists but empty (no commits)
  }
  return {
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? '',
    htmlUrl: r.html_url,
    stars: r.stargazers_count,
    forks: r.forks_count,
    primaryLanguage: r.language,
    sizeKb: r.size,
    updatedAt: r.pushed_at || r.updated_at,
    license: r.license && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id.replace(/-/g, ' ') : null,
    defaultBranch: r.default_branch,
    topics: r.topics ?? [],
    openIssues: r.open_issues_count,
  }
}

const IGNORED_ROOT = new Set(['node_modules', 'vendor', 'dist', 'build', 'out', '.git', 'coverage', '__pycache__', '.next', '.nuxt', 'venv', '.venv', 'target', 'Pods', 'site-packages'])

export interface TreeResult {
  files: FileInfo[]
  truncated: boolean
}

const FILE_BUDGET = 4000

export async function fetchTree(owner: string, name: string, branch: string): Promise<TreeResult> {
  const data = await gh<GhTree>(`/repos/${owner}/${name}/git/trees/${encodeURIComponent(branch)}?recursive=1`)
  const all: FileInfo[] = []
  for (const e of data.tree) {
    if (e.type !== 'blob') continue
    const parts = e.path.split('/')
    if (parts.some((p) => IGNORED_ROOT.has(p))) continue
    const dot = e.path.lastIndexOf('.')
    const slash = e.path.lastIndexOf('/')
    all.push({
      path: e.path,
      name: parts[parts.length - 1],
      dir: slash >= 0 ? e.path.slice(0, slash) : '',
      ext: dot > slash ? e.path.slice(dot + 1).toLowerCase() : '',
      size: e.size ?? 0,
    })
  }
  if (all.length <= FILE_BUDGET) {
    return { files: all, truncated: data.truncated }
  }
  // Very large repository: sample breadth first across every top level folder
  // instead of taking an alphabetical slice, then report the truncation honestly.
  const buckets = new Map<string, FileInfo[]>()
  for (const f of all) {
    const root = f.dir === '' ? '' : f.dir.split('/')[0]
    const bucket = buckets.get(root)
    if (bucket) bucket.push(f); else buckets.set(root, [f])
  }
  const files: FileInfo[] = []
  const lists = [...buckets.values()]
  let i = 0
  while (files.length < FILE_BUDGET) {
    let added = false
    for (const list of lists) {
      if (i < list.length) { files.push(list[i]); added = true }
      if (files.length >= FILE_BUDGET) break
    }
    if (!added) break
    i++
  }
  return { files, truncated: true }
}

export async function fetchLanguages(owner: string, name: string): Promise<Record<string, number>> {
  try {
    return await gh<Record<string, number>>(`/repos/${owner}/${name}/languages`)
  } catch {
    return {}
  }
}

/** Fetch raw text for a small set of files; used for manifests only. Never fetches source en masse. */
export async function fetchRaw(owner: string, name: string, branch: string, path: string): Promise<string | null> {
  try {
    const res = await fetch(`${RAW}/${owner}/${name}/${branch}/${path}`)
    if (!res.ok) return null
    const text = await res.text()
    return text.length > 200_000 ? text.slice(0, 200_000) : text
  } catch {
    return null
  }
}
