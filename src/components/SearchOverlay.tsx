import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, FileIcon, FolderIcon, SearchIcon, SparkIcon } from './shared/icons'

export interface SearchItem {
  id: string
  name: string
  kind: string
  detail: string
  nodeId?: string
  techName?: string
}

export function SearchOverlay({ items, onSelect, onClose }: {
  items: SearchItem[]
  onSelect: (item: SearchItem) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return items.slice(0, 12)
    return items
      .filter((i) => i.name.toLowerCase().includes(query) || i.kind.toLowerCase().includes(query) || i.detail.toLowerCase().includes(query))
      .sort((a, b) => a.name.toLowerCase().indexOf(query) - b.name.toLowerCase().indexOf(query))
      .slice(0, 30)
  }, [q, items])

  useEffect(() => { setActive(0) }, [q])

  const pick = (i: number) => { if (results[i]) onSelect(results[i]) }

  return (
    <div className="search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search the repository">
      <div className="search-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sd-input">
          <SearchIcon width={17} height={17} style={{ color: 'var(--ink-3)', flex: 'none' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files, folders, technologies, concepts"
            aria-label="Search query"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              else if (e.key === 'Enter') pick(active)
              else if (e.key === 'Escape') onClose()
            }}
          />
          <button className="detail-close" style={{ position: 'static' }} onClick={onClose} aria-label="Close search"><CloseIcon width={14} height={14} /></button>
        </div>
        <div className="search-results" role="listbox">
          {results.length === 0 && <div className="search-empty">Nothing matches that search.</div>}
          {results.map((r, i) => (
            <button key={r.id} className={`search-result ${i === active ? 'active' : ''}`} role="option" aria-selected={i === active}
              onClick={() => pick(i)} onMouseEnter={() => setActive(i)}>
              {r.kind === 'Folder' ? <FolderIcon width={15} height={15} style={{ color: 'var(--ink-3)', flex: 'none' }} />
                : r.kind === 'File' || r.kind === 'Guide step' ? <FileIcon width={15} height={15} style={{ color: 'var(--ink-3)', flex: 'none' }} />
                : <SparkIcon width={15} height={15} style={{ color: 'var(--accent)', flex: 'none' }} />}
              <span>
                <span className="sr-name">{r.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)' }}>{r.detail}</span>
              </span>
              <span className="sr-kind">{r.kind}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
