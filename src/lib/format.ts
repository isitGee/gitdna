export function formatBytes(kb: number): string {
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

export function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function relativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days < 31) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  return `${Math.floor(months / 12)} years ago`
}

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1c453', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219',
  'C#': '#178600', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', 'C++': '#f34b7d', C: '#555555',
  'Objective-C': '#438eff', HTML: '#e34c26', CSS: '#663399', SCSS: '#c6538c', Vue: '#41b883',
  Svelte: '#ff3e00', Shell: '#89e051', Elixir: '#6e4a7e', Haskell: '#5e5086', Lua: '#000080',
  R: '#198CE7', Scala: '#c22d40', Perl: '#0298c3', Zig: '#ec915c', Nix: '#7e7eff',
  Dockerfile: '#384d54', Makefile: '#427819', Markdown: '#083fa1', JSON: '#292929',
  YAML: '#cb171e', TOML: '#9c4221', XML: '#0060ac', 'Jupyter Notebook': '#DA5B0B',
}

export function languageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? '#6b7f99'
}

export function parseRepoUrl(input: string): { owner: string; name: string } | null {
  const raw = input.trim()
  if (!raw) return null
  let s = raw
  // allow "owner/repo" shorthand
  if (/^[\w.-]+\/[\w.-]+$/.test(s)) return { owner: s.split('/')[0], name: s.split('/')[1] }
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    if (!/(^|\.)github\.com$/i.test(url.hostname)) return null
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], name: parts[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}
