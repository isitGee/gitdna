import { navigate } from '../router'
import { AlertIcon, DnaIcon } from './shared/icons'

export function EmptyState() {
  return (
    <div className="state-box glass">
      <div className="sb-icon"><DnaIcon width={26} height={26} /></div>
      <h2>No repository loaded</h2>
      <p>Paste a public GitHub repository above to generate its gitDNA.</p>
      <p className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>github.com/owner/repository</p>
    </div>
  )
}

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  notFound: { title: "We couldn't read this repository.", body: 'Check that the URL points to a public GitHub repository and try again. Private repositories cannot be analyzed.' },
  rateLimit: { title: 'GitHub is asking us to slow down.', body: 'The public GitHub API has an hourly limit per visitor. Wait a few minutes and try again.' },
  empty: { title: 'This repository is empty.', body: 'The repository exists but has no files on its default branch yet, so there is nothing to analyze.' },
  tooLarge: { title: 'This repository is very large.', body: 'gitDNA analyzed what it could, but the file tree was truncated. The results cover the first portion of the repository.' },
  network: { title: 'Could not reach GitHub.', body: 'Check your internet connection and try again.' },
}

export function ErrorState({ kind }: { kind: string | null }) {
  const copy = ERROR_COPY[kind ?? ''] ?? { title: 'Something went wrong while reading this repository.', body: 'Please check the URL and try again. If it keeps happening, the repository may be temporarily unavailable.' }
  return (
    <div className="state-box error glass">
      <div className="sb-icon"><AlertIcon width={26} height={26} /></div>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <button className="btn btn-primary" onClick={() => { navigate('/'); window.dispatchEvent(new HashChangeEvent('hashchange')) }}>Try another repository</button>
    </div>
  )
}
