import { useState } from 'react'
import type { Analysis } from '../types'
import { CloseIcon } from './shared/icons'
import { useToast } from './shared/ToastHost'

export function ShareDialog({ analysis, onClose }: { analysis: Analysis; onClose: () => void }) {
  const toast = useToast()
  const [copied, setCopied] = useState<string | null>(null)
  const { owner, name } = analysis.repo
  const link = `https://gitdna.dev/github/${owner}/${name}`
  const localLink = `${window.location.origin}${window.location.pathname}#/github/${owner}/${name}`
  const badge = `[![gitDNA analysis](https://img.shields.io/badge/gitDNA-understand%20this%20repo-0b5fdb)](https://gitdna.dev/github/${owner}/${name})`

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast('Copied to clipboard')
    } catch {
      toast('Could not access the clipboard in this browser')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Share this analysis">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3>Share analysis</h3>
            <p className="m-sub">A permanent gitDNA link for <b className="mono">{owner}/{name}</b>.</p>
          </div>
          <button className="detail-close" style={{ position: 'static' }} onClick={onClose} aria-label="Close"><CloseIcon width={14} height={14} /></button>
        </div>
        <div className="dl" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>gitDNA link</div>
        <div className="copy-row">
          <div className="cv" tabIndex={0}>{link}</div>
          <button className="btn btn-sm" onClick={() => copy(link, 'link')}>Copy</button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '14px 0 6px' }}>Live session link</div>
        <div className="copy-row">
          <div className="cv" tabIndex={0}>{localLink}</div>
          <button className="btn btn-sm" onClick={() => copy(localLink, 'local')}>Copy</button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '14px 0 6px' }}>README badge</div>
        <div className="copy-row">
          <textarea readOnly value={badge} aria-label="README badge markdown" onFocus={(e) => e.currentTarget.select()} />
          <button className="btn btn-sm" onClick={() => copy(badge, 'badge')}>Copy</button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12 }}>
          Paste the badge into any GitHub README so visitors can jump straight into the gitDNA analysis of the repository.
        </p>
      </div>
    </div>
  )
}
