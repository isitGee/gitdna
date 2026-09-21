import { useState } from 'react'
import type { Analysis } from '../../types'
import { formatBytes } from '../../lib/format'
import { CheckIcon, ExternalIcon, FileIcon, FolderIcon, SparkIcon } from '../shared/icons'
import { TechLogo } from '../shared/TechLogo'
import { explainFile } from '../../lib/explain'

export function DNAView({ analysis, compact }: { analysis: Analysis; compact?: boolean }) {
  return (
    <div className={compact ? '' : 'dna-grid'}>
      <div>
        <section className="panel glass" aria-labelledby="identity-h">
          <h2 id="identity-h">Project identity</h2>
          <p className="identity-text">{analysis.identity.summary}</p>
          <div className="chips">
            {analysis.identity.keywords.map((k) => <span className="chip accent" key={k}>{k}</span>)}
          </div>
        </section>

        <section className="panel glass" aria-labelledby="tech-h">
          <h2 id="tech-h">Technology stack</h2>
          <div className="tech-grid">
            {analysis.tech.slice(0, compact ? 6 : 14).map((t) => (
              <div className="tech-item card card-hover" key={t.name} title={t.evidence}>
                <span className="tech-icon"><TechLogo name={t.name} category={t.category} size={20} /></span>
                <span>
                  <span className="tn" style={{ display: 'block' }}>{t.name}</span>
                  <span className="tc">{t.category}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel glass" aria-labelledby="lang-h">
          <h2 id="lang-h">Language composition</h2>
          <div className="lang-bar" role="img" aria-label={analysis.languages.map((l) => `${l.language} ${l.percent} percent`).join(', ')}>
            {analysis.languages.map((l) => (
              <div key={l.language} style={{ width: `${l.percent}%`, background: l.color }} title={`${l.language} ${l.percent}%`} />
            ))}
          </div>
          <div className="lang-legend">
            {analysis.languages.map((l) => (
              <span className="ll" key={l.language}>
                <TechLogo name={l.language} category="Language" size={15} />
                <span className="lang-dot" style={{ background: l.color }} />
                <b>{l.language}</b> {l.percent}%
              </span>
            ))}
          </div>
        </section>
      </div>

      <div>
        <section className="panel glass" aria-labelledby="structure-h">
          <h2 id="structure-h">Project structure</h2>
          {analysis.topFolders.map((f) => (
            <div className="folder-row" key={f.path}>
              <span className="ficon"><FolderIcon width={17} height={17} /></span>
              <span className="fmeta">
                <span className="fname">{f.path}</span>
                <span className="fpurpose" style={{ display: 'block' }}>{f.purpose}</span>
              </span>
              <span className="fcount">{f.files} files</span>
            </div>
          ))}
          {analysis.topFolders.length === 0 && (
            <p className="dv" style={{ color: 'var(--ink-3)', fontSize: 13.5 }}>All files live at the repository root.</p>
          )}
        </section>

        <section className="panel glass" aria-labelledby="chars-h">
          <h2 id="chars-h">Project characteristics</h2>
          <div className="char-grid">
            {analysis.characteristics.map((c) => (
              <div className="char-item card" key={c.label}>
                <span className="ci"><CheckIcon width={15} height={15} /></span>
                <span>
                  <span className="cl" style={{ display: 'block' }}>{c.label}</span>
                  <span className="cd">{c.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export function ImportantFilesPanel({ analysis, onOpenFile, showExplain }: {
  analysis: Analysis
  onOpenFile?: (path: string) => void
  showExplain?: boolean
}) {
  const [explainPath, setExplainPath] = useState<string | null>(null)
  const file = analysis.importantFiles.find((f) => f.path === explainPath)
  const ex = file ? explainFile(file) : null
  return (
    <section className="panel glass" aria-labelledby="imp-h">
      <h2 id="imp-h">Important files</h2>
      <div className="file-list">
        {analysis.importantFiles.slice(0, 8).map((f) => (
          <div key={f.path}>
            <button className="file-row" onClick={() => { onOpenFile?.(f.path); showExplain && setExplainPath(explainPath === f.path ? null : f.path) }}>
              <FileIcon className="fr-icon" width={14} height={14} />
              {f.path}
              <span className="fr-meta">{formatBytes(f.size / 1024)}</span>
            </button>
            {showExplain && explainPath === f.path && ex && (
              <div className="explain-box">
                <h4><SparkIcon width={14} height={14} /> In plain English</h4>
                <div className="ex-item"><div className="ex-q">What does this file do?</div><div className="ex-a">{ex.what}</div></div>
                <div className="ex-item"><div className="ex-q">Why does it matter?</div><div className="ex-a">{ex.why}</div></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function HealthPanel({ analysis }: { analysis: Analysis }) {
  return (
    <section className="panel glass" aria-labelledby="health-h">
      <h2 id="health-h">Repository health</h2>
      {analysis.health.map((h) => (
        <div className="health-row" key={h.category}>
          <span className={`health-pill ${h.status}`}>
            {h.status === 'present' ? 'Detected' : h.status === 'notice' ? 'Partial' : 'Not found'}
          </span>
          <span className="health-cat">{h.category}</span>
          <span className="health-obs">{h.observations.map((o, i) => <div key={i}>{o}</div>)}</span>
        </div>
      ))}
    </section>
  )
}

export function OverviewCards({ analysis }: { analysis: Analysis }) {
  const r = analysis.repo
  const items: [string, React.ReactNode][] = [
    ['Stars', <b key="v">{r.stars.toLocaleString()}</b>],
    ['Forks', <b key="v">{r.forks.toLocaleString()}</b>],
    ['Primary language', r.primaryLanguage ? <span key="v" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="lang-dot" style={{ background: analysis.languages[0]?.color ?? '#888' }} />{r.primaryLanguage}</span> : 'None'],
    ['Files', <b key="v">{analysis.fileCount.toLocaleString()}</b>],
    ['Repository size', formatBytes(r.sizeKb)],
    ['Last updated', new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
    ['License', r.license ?? 'None declared'],
    ['Default branch', <span className="mono" key="v">{r.defaultBranch}</span>],
  ]
  return (
    <div className="overview-grid">
      {items.map(([label, value]) => (
        <div className="ov-card card" key={label as string}>
          <div className="ov-label">{label}</div>
          <div className={`ov-value ${typeof value === 'string' && value.length > 12 ? 'small' : ''}`}>{value}</div>
        </div>
      ))}
    </div>
  )
}
