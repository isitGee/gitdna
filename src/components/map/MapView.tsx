import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Analysis, GraphNode, NodeGroup } from '../../types'
import { layoutGraph, NODE_SIZE, groupLabel } from '../../lib/graph'
import { explainFile, explainNode } from '../../lib/explain'
import { CloseIcon, ExternalIcon, FitIcon, FilterIcon, MinusIcon, PlusIcon, ResetIcon, SearchIcon, SparkIcon } from '../shared/icons'

const GROUP_COLORS: Record<NodeGroup, string> = {
  entry: '#0b5fdb', core: '#4f46e5', ui: '#0e7490', services: '#7c3aed',
  data: '#b45309', external: '#475569', config: '#0369a1', tests: '#15803d',
  docs: '#a16207', ci: '#be185d', deps: '#6b7280',
}

interface View { x: number; y: number; k: number }

export function MapView({ analysis, focusNodeId, onFocusHandled, embedded }: {
  analysis: Analysis
  focusNodeId?: string | null
  onFocusHandled?: () => void
  embedded?: boolean
}) {
  const { nodes, width: W, height: H } = useMemo(() => layoutGraph(analysis.graph), [analysis])
  const [view, setView] = useState<View>({ x: 40, y: 30, k: 1 })
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [hiddenGroups, setHiddenGroups] = useState<Set<NodeGroup>>(new Set())
  const [explained, setExplained] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ px: number; py: number; moved: boolean } | null>(null)

  const visible = useMemo(() => nodes.filter((n) => !hiddenGroups.has(n.group)), [nodes, hiddenGroups])
  const visibleIds = useMemo(() => new Set(visible.map((n) => n.id)), [visible])
  const selectedNode = visible.find((n) => n.id === selected) ?? null

  const neighbors = useMemo(() => {
    if (!selected) return null
    const s = new Set<string>([selected])
    for (const e of analysis.graph.edges) {
      if (e.source === selected) s.add(e.target)
      if (e.target === selected) s.add(e.source)
    }
    return s
  }, [selected, analysis.graph.edges])

  const fit = useCallback(() => {
    const shell = shellRef.current
    if (!shell || visible.length === 0) return
    const rect = shell.getBoundingClientRect()
    const minX = Math.min(...visible.map((n) => n.x))
    const minY = Math.min(...visible.map((n) => n.y))
    const maxX = Math.max(...visible.map((n) => n.x + NODE_SIZE.w))
    const maxY = Math.max(...visible.map((n) => n.y + NODE_SIZE.h))
    const k = Math.min((rect.width - 80) / (maxX - minX), (rect.height - 120) / (maxY - minY), 1.25)
    setView({
      k,
      x: (rect.width - (maxX - minX) * k) / 2 - minX * k,
      y: (rect.height - (maxY - minY) * k) / 2 - minY * k + 10,
    })
  }, [visible])

  useEffect(() => {
    fit()
    setSelected(null)
    setExplained(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis])

  // focus a node from search
  useEffect(() => {
    if (!focusNodeId) return
    const node = nodes.find((n) => n.id === focusNodeId)
    if (node) {
      const shell = shellRef.current
      const rect = shell?.getBoundingClientRect()
      if (rect) {
        setView((v) => ({
          k: Math.max(v.k, 0.85),
          x: rect.width / 2 - (node.x + NODE_SIZE.w / 2) * Math.max(v.k, 0.85),
          y: rect.height / 2 - (node.y + NODE_SIZE.h / 2) * Math.max(v.k, 0.85),
        }))
      }
      setSelected(node.id)
      setExplained(false)
    }
    onFocusHandled?.()
  }, [focusNodeId, nodes, onFocusHandled])

  // zoom on wheel toward cursor
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const rect = shellRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setView((v) => {
      const k = Math.min(2.4, Math.max(0.25, v.k * (e.deltaY < 0 ? 1.12 : 0.89)))
      const wx = (mx - v.x) / v.k
      const wy = (my - v.y) / v.k
      return { k, x: mx - wx * k, y: my - wy * k }
    })
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('.graph-node')) return
    drag.current = { px: e.clientX, py: e.clientY, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.px
    const dy = e.clientY - drag.current.py
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true
    drag.current.px = e.clientX
    drag.current.py = e.clientY
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
  }
  const onPointerUp = () => {
    if (drag.current && !drag.current.moved) setSelected(null)
    drag.current = null
  }
  const zoomBy = (f: number) => {
    const rect = shellRef.current?.getBoundingClientRect()
    if (!rect) return
    setView((v) => {
      const k = Math.min(2.4, Math.max(0.25, v.k * f))
      const cx = rect.width / 2, cy = rect.height / 2
      const wx = (cx - v.x) / v.k, wy = (cy - v.y) / v.k
      return { k, x: cx - wx * k, y: cy - wy * k }
    })
  }

  const q = query.trim().toLowerCase()
  const matches = (n: { id: string }) => !q || n.id.toLowerCase().includes(q)

  const edgePath = (sx: number, sy: number, tx: number, ty: number) => {
    const leftToRight = tx >= sx
    const x1 = leftToRight ? sx + NODE_SIZE.w : sx
    const x2 = leftToRight ? tx : tx + NODE_SIZE.w
    const y1 = sy + NODE_SIZE.h / 2
    const y2 = ty + NODE_SIZE.h / 2
    const dx = Math.max(50, Math.abs(x2 - x1) * 0.5)
    const c1 = leftToRight ? x1 + dx : x1 - dx
    const c2 = leftToRight ? x2 - dx : x2 + dx
    return `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`
  }

  const toggleGroup = (g: NodeGroup) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g); else next.add(g)
      return next
    })
  }

  const groupsPresent = useMemo(() => [...new Set(nodes.map((n) => n.group))], [nodes])

  const explain = explained && selectedNode
    ? selectedNode.path && selectedNode.kind === 'file'
      ? explainFile({ path: selectedNode.path, name: selectedNode.label, dir: selectedNode.path.includes('/') ? selectedNode.path.slice(0, selectedNode.path.lastIndexOf('/')) : '', ext: selectedNode.path.split('.').pop() ?? '', size: 0 }, { folderPurpose: selectedNode.purpose })
      : explainNode(selectedNode)
    : null

  const selNodeEdges = analysis.graph.edges.filter((e) => e.source === selected || e.target === selected)

  return (
    <div className="map-shell" ref={shellRef} style={embedded ? { height: 380, minHeight: 320 } : undefined}>
      <div className="map-toolbar">
        <div className="map-search" role="search">
          <SearchIcon width={15} height={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the map"
            aria-label="Search the map"
          />
        </div>
        <div className="map-tools">
          <button className={`tool-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters((s) => !s)} title="Filter groups" aria-label="Filter groups" aria-expanded={showFilters}>
            <FilterIcon width={16} height={16} />
          </button>
          <button className="tool-btn" onClick={() => zoomBy(1.2)} title="Zoom in" aria-label="Zoom in"><PlusIcon width={16} height={16} /></button>
          <button className="tool-btn" onClick={() => zoomBy(0.83)} title="Zoom out" aria-label="Zoom out"><MinusIcon width={16} height={16} /></button>
          <button className="tool-btn" onClick={fit} title="Fit to screen" aria-label="Fit to screen"><FitIcon width={16} height={16} /></button>
          <button className="tool-btn" onClick={() => { setHiddenGroups(new Set()); setQuery(''); fit() }} title="Reset view" aria-label="Reset view"><ResetIcon width={16} height={16} /></button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-menu" role="group" aria-label="Filter node groups">
          {groupsPresent.map((g) => (
            <label key={g}>
              <input type="checkbox" checked={!hiddenGroups.has(g)} onChange={() => toggleGroup(g)} />
              <span className="sw" style={{ width: 10, height: 10, borderRadius: 3, background: GROUP_COLORS[g], display: 'inline-block' }} />
              {groupLabel(g)}
            </label>
          ))}
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%" height="100%"
        style={{ touchAction: 'none', cursor: drag.current ? 'grabbing' : 'grab', display: 'block' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={(e) => { if (e.key === 'Escape') setSelected(null) }}
        tabIndex={0}
        role="img"
        aria-label={`Architecture map of ${analysis.repo.fullName} with ${visible.length} components`}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge-stroke)" />
          </marker>
          <marker id="arrow-hl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
          </marker>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {analysis.graph.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)).map((e, i) => {
            const sn = nodes.find((n) => n.id === e.source)!
            const tn = nodes.find((n) => n.id === e.target)!
            const hl = selected && (e.source === selected || e.target === selected)
            const dim = selected && !hl
            return (
              <g key={i}>
                <path
                  className={`graph-edge ${hl ? 'highlight' : ''} ${dim ? 'dimmed' : ''}`}
                  d={edgePath(sn.x, sn.y, tn.x, tn.y)}
                  markerEnd={hl ? 'url(#arrow-hl)' : 'url(#arrow)'}
                />
                {hl && e.label && (
                  <text className="edge-label" x={(sn.x + tn.x) / 2 + NODE_SIZE.w / 2 - 20} y={(sn.y + tn.y) / 2 + NODE_SIZE.h / 2 - 6}>
                    {e.label}
                  </text>
                )}
              </g>
            )
          })}
          {visible.map((n) => {
            const dim = (neighbors && !neighbors.has(n.id)) || (q !== '' && !matches(n))
            const color = GROUP_COLORS[n.group]
            const hit = q !== '' && matches(n)
            return (
              <g
                key={n.id}
                className={`graph-node ${selected === n.id ? 'selected' : ''} ${dim ? 'dimmed' : ''}`}
                transform={`translate(${n.x} ${n.y})`}
                onClick={() => { setSelected(n.id); setExplained(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(n.id); setExplained(false) } }}
                tabIndex={0}
                role="button"
                aria-label={`${n.label}. ${groupLabel(n.group)}. ${n.purpose}`}
              >
                <rect width={NODE_SIZE.w} height={NODE_SIZE.h} rx={12}
                  fill="var(--node-fill)"
                  stroke={hit ? 'var(--accent)' : 'var(--node-stroke)'} strokeWidth={hit ? 2.5 : 1}
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(16,32,56,0.10))' }} />
                <rect width={5} height={NODE_SIZE.h} rx={2.5} fill={color} />
                <rect x={14} y={14} width={26} height={26} rx={7} fill={`${color}1a`} />
                <text x={27} y={31.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={color} fontFamily="var(--font-tech)">
                  {n.kind === 'folder' ? '▤' : n.kind === 'actor' ? '◍' : n.kind === 'dependency' ? '⬡' : n.kind === 'concept' ? '◈' : '▢'}
                </text>
                <text className="gn-sub" x={48} y={25}>{groupLabel(n.group)}</text>
                <text className="gn-label" x={14} y={58}>
                  {n.label.length > 24 ? n.label.slice(0, 23) + '…' : n.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {!embedded && (
        <div className="map-legend" aria-hidden="true">
          {groupsPresent.slice(0, 6).map((g) => (
            <span className="lg" key={g}><span className="sw" style={{ background: GROUP_COLORS[g] }} />{groupLabel(g)}</span>
          ))}
        </div>
      )}

      {!embedded && <Minimap nodes={visible} view={view} W={W} H={H} shell={shellRef} colors={GROUP_COLORS} onJump={(x, y) => setView((v) => ({ ...v, x: -x * v.k + (shellRef.current?.clientWidth ?? 0) / 2, y: -y * v.k + (shellRef.current?.clientHeight ?? 0) / 2 }))} />}

      {selectedNode && (
        <aside className="detail-panel" aria-label={`Details for ${selectedNode.label}`}>
          <button className="detail-close" onClick={() => setSelected(null)} aria-label="Close details"><CloseIcon width={14} height={14} /></button>
          <h3>{selectedNode.path ?? selectedNode.label}</h3>
          <div className="chips" style={{ marginTop: 8 }}>
            <span className="chip accent">{groupLabel(selectedNode.group)}</span>
            {selectedNode.tech.map((t) => <span className="chip" key={t}>{t}</span>)}
          </div>

          <div className="detail-section">
            <div className="dl">Purpose</div>
            <div className="dv">{selectedNode.purpose}</div>
          </div>
          <div className="detail-section">
            <div className="dl">Why it matters</div>
            <div className="dv">{selectedNode.why}</div>
          </div>
          {selNodeEdges.length > 0 && (
            <div className="detail-section">
              <div className="dl">Connections</div>
              {selNodeEdges.map((e, i) => {
                const other = nodes.find((n) => n.id === (e.source === selectedNode.id ? e.target : e.source))
                if (!other) return null
                return (
                  <div className="dv" key={i} style={{ marginBottom: 3 }}>
                    {e.source === selectedNode.id ? `→ ${e.kind} ` : `← ${e.kind} `}
                    <button className="btn-ghost btn-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => { setSelected(other.id); setExplained(false) }}>
                      {other.label}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={() => setExplained((x) => !x)}>
            <SparkIcon width={14} height={14} /> {explained ? 'Hide explanation' : 'Explain this'}
          </button>
          {explain && (
            <div className="explain-box">
              <h4><SparkIcon width={14} height={14} /> In plain English</h4>
              <div className="ex-item"><div className="ex-q">What does this do?</div><div className="ex-a">{explain.what}</div></div>
              <div className="ex-item"><div className="ex-q">Why does it matter?</div><div className="ex-a">{explain.why}</div></div>
              <div className="ex-item"><div className="ex-q">What to notice</div><div className="ex-a">{explain.watch}</div></div>
            </div>
          )}

          {selectedNode.htmlUrl && (
            <a className="btn" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }} href={selectedNode.htmlUrl} target="_blank" rel="noreferrer">
              <ExternalIcon width={14} height={14} /> Open on GitHub
            </a>
          )}
        </aside>
      )}
    </div>
  )
}

function Minimap({ nodes, view, W, H, shell, colors, onJump }: {
  nodes: { x: number; y: number; group: NodeGroup; id: string }[]
  view: View; W: number; H: number
  shell: React.RefObject<HTMLDivElement>
  colors: Record<NodeGroup, string>
  onJump: (x: number, y: number) => void
}) {
  const MW = 180, MH = 120, PAD = 8
  const k = Math.min((MW - PAD * 2) / W, (MH - PAD * 2) / H)
  const shellW = shell.current?.clientWidth ?? 800
  const shellH = shell.current?.clientHeight ?? 500
  const vx = (-view.x / view.k) * k + PAD
  const vy = (-view.y / view.k) * k + PAD
  const vw = (shellW / view.k) * k
  const vh = (shellH / view.k) * k
  return (
    <div className="minimap" aria-hidden="true">
      <svg width={MW} height={MH}>
        {nodes.map((n) => (
          <rect key={n.id} x={n.x * k + PAD} y={n.y * k + PAD} width={Math.max(3, NODE_SIZE.w * k)} height={Math.max(2, NODE_SIZE.h * k)}
            rx={1.5} fill={colors[n.group]} opacity={0.65} />
        ))}
        <rect x={vx} y={vy} width={vw} height={vh} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.2} rx={2}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            const rect = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect()
            const mx = ((e.clientX - rect.left - PAD) / k) 
            const my = ((e.clientY - rect.top - PAD) / k)
            onJump(mx, my)
          }} />
      </svg>
    </div>
  )
}
