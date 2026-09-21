import type { Analysis } from '../../types'
import { ExternalIcon, FileIcon, FolderIcon, SparkIcon } from '../shared/icons'
import { explainFile } from '../../lib/explain'
import { useState } from 'react'
import { formatBytes } from '../../lib/format'

export function GuideView({ analysis, onOpenInMap }: { analysis: Analysis; onOpenInMap: (path: string) => void }) {
  return (
    <div className="guide-layout">
      <section className="panel glass" aria-labelledby="path-h">
        <h2 id="path-h" style={{ marginBottom: 4 }}>Exploration path</h2>
        <p style={{ color: 'var(--ink-2)', fontSize: 13.5, marginTop: 0, marginBottom: 20 }}>
          A recommended order for reading this repository, generated from its actual structure.
        </p>
        {analysis.guide.map((step, i) => <PathStep key={step.path} step={step} index={i} last={i === analysis.guide.length - 1} analysis={analysis} onOpenInMap={onOpenInMap} />)}
        {analysis.guide.length === 0 && <p style={{ color: 'var(--ink-3)' }}>Not enough structure was detected to build a path.</p>}
      </section>

      <div>
        <FileGroup title="Recommended first files" files={analysis.guide.slice(0, 3).map((s) => s.path)} analysis={analysis} onOpenInMap={onOpenInMap} />
        <FileGroup title="Potential entry points" files={analysis.entryPoints.map((f) => f.path)} analysis={analysis} onOpenInMap={onOpenInMap} />
        <FileGroup title="Configuration files" files={analysis.configFiles.slice(0, 6).map((f) => f.path)} analysis={analysis} onOpenInMap={onOpenInMap} />
        <FileGroup title="Tests" files={analysis.testFiles.slice(0, 6).map((f) => f.path)} analysis={analysis} onOpenInMap={onOpenInMap} emptyText="No test files were detected." />
      </div>
    </div>
  )
}

function PathStep({ step, index, last, analysis, onOpenInMap }: {
  step: Analysis['guide'][number]; index: number; last: boolean
  analysis: Analysis; onOpenInMap: (path: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="path-step">
      <div className="path-rail">
        <div className="path-num">{index + 1}</div>
        {!last && <div className="path-line" />}
      </div>
      <div className="path-card card card-hover" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}
        aria-expanded={open}>
        <div className="pc-head">
          <span className="pc-path">{step.path}</span>
          <span className="pc-role">{step.role}</span>
          <span className={`level-pill ${step.level}`}>{step.level}</span>
        </div>
        <p>{step.what}</p>
        {open && (
          <>
            <p><b>Why look at it:</b> {step.why}</p>
            <p><b>Understand first:</b> {step.understandBefore}</p>
            <div className="pc-actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn btn-sm" onClick={() => onOpenInMap(step.path)}>
                <SparkIcon width={13} height={13} /> Show on map
              </button>
              {step.htmlUrl && (
                <a className="btn btn-sm" href={step.htmlUrl} target="_blank" rel="noreferrer">
                  <ExternalIcon width={13} height={13} /> Open on GitHub
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FileGroup({ title, files, analysis, onOpenInMap, emptyText }: {
  title: string; files: string[]; analysis: Analysis; onOpenInMap: (p: string) => void; emptyText?: string
}) {
  const [explainPath, setExplainPath] = useState<string | null>(null)
  const file = files.find((p) => p === explainPath)
  const info = file ? analysis.importantFiles.find((f) => f.path === file) ?? analysis.entryPoints.find((f) => f.path === file) ?? analysis.configFiles.find((f) => f.path === file) ?? analysis.testFiles.find((f) => f.path === file) : null
  const ex = info ? explainFile(info) : null
  return (
    <section className="panel glass" aria-label={title}>
      <h2 style={{ fontSize: 15 }}>{title}</h2>
      {files.length === 0 && <p style={{ color: 'var(--ink-3)', fontSize: 13.5, margin: '6px 0 0' }}>{emptyText ?? 'None detected.'}</p>}
      <div className="file-list">
        {files.map((p) => (
          <div key={p}>
            <button className="file-row" onClick={() => setExplainPath(explainPath === p ? null : p)}>
              <FileIcon className="fr-icon" width={14} height={14} />
              {p}
              {info?.path === p && <span className="fr-meta">{formatBytes(info.size / 1024)}</span>}
            </button>
            {explainPath === p && ex && (
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
