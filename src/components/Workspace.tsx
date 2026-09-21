import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Analysis } from '../types'
import { DNAView, HealthPanel, ImportantFilesPanel, OverviewCards } from './dna/DNAView'
import { MapView } from './map/MapView'
import { GuideView } from './guide/GuideView'
import { SearchOverlay } from './SearchOverlay'
import type { SearchItem } from './SearchOverlay'
import { ShareDialog } from './ShareDialog'
import { DnaIcon, ExternalIcon, ForkIcon, GitHubIcon, GuideIcon, MapIcon, SearchIcon, ShareIcon, StarIcon } from './shared/icons'
import { useToast } from './shared/ToastHost'

type ViewKey = 'dna' | 'map' | 'guide'

export function Workspace({ analysis, onNewAnalysis }: { analysis: Analysis; onNewAnalysis: () => void }) {
  const [view, setView] = useState<ViewKey>('dna')
  const [searchOpen, setSearchOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [focusNode, setFocusNode] = useState<string | null>(null)
  const toast = useToast()
  const r = analysis.repo

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const searchItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = []
    for (const n of analysis.graph.nodes) {
      items.push({ id: n.id, name: n.path ?? n.label, kind: n.kind === 'folder' ? 'Folder' : n.kind === 'concept' || n.kind === 'actor' ? 'Concept' : n.kind === 'dependency' ? 'Dependency' : 'File', detail: n.purpose, nodeId: n.id })
    }
    for (const t of analysis.tech) {
      items.push({ id: `tech:${t.name}`, name: t.name, kind: 'Technology', detail: t.evidence, techName: t.name })
    }
    for (const f of [...analysis.importantFiles, ...analysis.testFiles.slice(0, 6), ...analysis.configFiles.slice(0, 6)]) {
      if (!items.some((i) => i.nodeId === `file:${f.path}`)) {
        items.push({ id: `file:${f.path}`, name: f.path, kind: 'File', detail: 'Project file', nodeId: `file:${f.path}` })
      }
    }
    for (const s of analysis.guide) {
      items.push({ id: `guide:${s.path}`, name: s.path, kind: 'Guide step', detail: s.role, nodeId: `file:${s.path}` })
    }
    return items
  }, [analysis])

  const resolveNodeId = useCallback((nodeIdOrPath: string): string | null => {
    const nodes = analysis.graph.nodes
    if (nodes.some((n) => n.id === nodeIdOrPath)) return nodeIdOrPath
    for (const candidate of [`file:${nodeIdOrPath}`, `folder:${nodeIdOrPath}`]) {
      if (nodes.some((n) => n.id === candidate)) return candidate
    }
    const byPath = nodes.find((n) => n.path === nodeIdOrPath)
    if (byPath) return byPath.id
    if (/test|spec/i.test(nodeIdOrPath)) {
      const testsNode = nodes.find((n) => n.group === 'tests')
      if (testsNode) return testsNode.id
    }
    return null
  }, [analysis.graph.nodes])

  const openInMap = useCallback((nodeIdOrPath: string) => {
    const nodeId = resolveNodeId(nodeIdOrPath)
    setView('map')
    if (nodeId) setFocusNode(nodeId)
    else toast('This file is not a node on the map. Showing the closest components instead.')
  }, [resolveNodeId, toast])

  const onSearchSelect = useCallback((item: SearchItem) => {
    setSearchOpen(false)
    if (item.techName) { setView('dna'); toast(`Showing the technology stack. Look for ${item.techName}.`); return }
    const nodeId = item.nodeId ? resolveNodeId(item.nodeId) : null
    if (nodeId) {
      setView('map')
      setTimeout(() => setFocusNode(nodeId), 60)
    } else {
      setView('dna')
      toast('This item is described in the DNA view.')
    }
  }, [resolveNodeId, toast])

  return (
    <div className="workspace">
      <header className="repo-header glass">
        <div className="rh-main">
          <h1>
            <GitHubIcon width={22} height={22} style={{ color: 'var(--ink-2)' }} />
            <span className="owner">{r.owner} /</span>
            <a href={r.htmlUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--ink)' }}>{r.name}</a>
          </h1>
          {r.description && <p className="desc">{r.description}</p>}
          <div className="repo-stats">
            <span className="stat"><StarIcon width={14} height={14} style={{ color: '#b8860b' }} /><b>{r.stars.toLocaleString()}</b> stars</span>
            <span className="stat"><ForkIcon width={14} height={14} /><b>{r.forks.toLocaleString()}</b> forks</span>
            {r.primaryLanguage && <span className="stat"><span className="lang-dot" style={{ background: analysis.languages[0]?.color ?? '#888' }} /><b>{r.primaryLanguage}</b></span>}
            <span className="stat"><b>{analysis.fileCount.toLocaleString()}</b> files</span>
            <span className="stat"><b>{analysis.graph.nodes.length}</b> mapped components</span>
          </div>
        </div>
        <div className="rh-actions">
          <button className="btn" onClick={() => setSearchOpen(true)}><SearchIcon width={15} height={15} /> Search <span className="kbd">Ctrl K</span></button>
          <button className="btn" onClick={() => setShareOpen(true)}><ShareIcon width={15} height={15} /> Share analysis</button>
          <button className="btn btn-primary" onClick={onNewAnalysis}>Analyze another</button>
        </div>
      </header>

      <OverviewCards analysis={analysis} />

      <div className="view-tabs" role="tablist" aria-label="Analysis views">
        <div className="tabs">
          <button role="tab" aria-selected={view === 'dna'} onClick={() => setView('dna')}><DnaIcon width={15} height={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />DNA</button>
          <button role="tab" aria-selected={view === 'map'} onClick={() => setView('map')}><MapIcon width={15} height={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Map</button>
          <button role="tab" aria-selected={view === 'guide'} onClick={() => setView('guide')}><GuideIcon width={15} height={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />Guide</button>
        </div>
      </div>

      {view === 'dna' && (
        <div>
          <DNAView analysis={analysis} />
          <div className="dna-grid" style={{ marginTop: 0 }}>
            <div>
              <ImportantFilesPanel analysis={analysis} showExplain onOpenFile={openInMap} />
            </div>
            <HealthPanel analysis={analysis} />
          </div>
        </div>
      )}

      {view === 'map' && <MapView analysis={analysis} focusNodeId={focusNode} onFocusHandled={() => setFocusNode(null)} />}

      {view === 'guide' && <GuideView analysis={analysis} onOpenInMap={openInMap} />}

      {searchOpen && <SearchOverlay items={searchItems} onSelect={onSearchSelect} onClose={() => setSearchOpen(false)} />}
      {shareOpen && <ShareDialog analysis={analysis} onClose={() => setShareOpen(false)} />}
    </div>
  )
}
