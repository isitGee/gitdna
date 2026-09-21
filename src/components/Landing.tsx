import { useState } from 'react'
import { parseRepoUrl } from '../lib/format'
import { navigate } from '../router'
import { DnaIcon, GuideIcon, MapIcon, SparkIcon } from './shared/icons'

export function Landing() {
  const [input, setInput] = useState('')
  const [invalid, setInvalid] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseRepoUrl(input)
    if (!parsed) { setInvalid(true); return }
    setInvalid(false)
    navigate(`/github/${parsed.owner}/${parsed.name}`)
  }

  return (
    <main className="landing">
      <section className="hero" id="product">
        <span className="tagline-chip"><SparkIcon width={14} height={14} /> Understand the code before you touch it</span>
        <h1>Understand any GitHub repository.</h1>
        <p className="sub">gitDNA turns unfamiliar repositories into clear visual maps, project insights, and guided paths through the code.</p>
        <form className="repo-input-wrap" onSubmit={submit}>
          <div className="repo-input" style={invalid ? { borderColor: 'var(--danger)' } : undefined}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <label htmlFor="repo-url" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>GitHub repository URL</label>
            <input
              id="repo-url"
              value={input}
              onChange={(e) => { setInput(e.target.value); setInvalid(false) }}
              placeholder="Paste a GitHub repository URL"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="btn btn-primary btn-lg" type="submit">Analyze a repository</button>
          </div>
          {invalid && <p style={{ color: 'var(--danger)', fontSize: 13.5, marginTop: 10 }} role="alert">That does not look like a GitHub repository URL. Try the form github.com/owner/repository.</p>}
          <div className="hero-note">
            <span>Public repositories only</span>
            <span aria-hidden="true">·</span>
            <span className="hero-example">Example <code>github.com/owner/repository</code></span>
          </div>
        </form>
      </section>

      <section className="how-section" id="how" aria-label="How gitDNA works">
        <h2>From URL to understanding in seconds</h2>
        <p className="ssub">gitDNA reads the real structure of the repository. Nothing is invented, and nothing is preloaded.</p>
        <ol className="steps-grid">
          <li className="step-card glass">
            <span className="step-num">1</span>
            <h3>Paste a repository</h3>
            <p>Any public GitHub repository. gitDNA reads its file tree, languages, manifests, and documentation directly from GitHub.</p>
          </li>
          <li className="step-card glass">
            <span className="step-num">2</span>
            <h3>Read the DNA</h3>
            <p>Project identity, technology stack with official logos, language composition, structure, characteristics, and health, all derived from detected files.</p>
          </li>
          <li className="step-card glass">
            <span className="step-num">3</span>
            <h3>Explore and share</h3>
            <p>Walk the interactive architecture map, follow the guided exploration path, and share the analysis with a permanent gitDNA link.</p>
          </li>
        </ol>
      </section>

      <section className="feature-strip" aria-label="What gitDNA gives you">
        <div className="feature glass">
          <h3><span className="fi"><MapIcon width={16} height={16} /></span>See the architecture</h3>
          <p>An interactive map shows how folders, entry points, services, data, tests, and automation connect, generated from the real repository.</p>
        </div>
        <div className="feature glass">
          <h3><span className="fi"><GuideIcon width={16} height={16} /></span>Know where to start</h3>
          <p>A guided path takes you from the README through entry points to services and tests, with a difficulty level for each step.</p>
        </div>
        <div className="feature glass">
          <h3><span className="fi"><DnaIcon width={16} height={16} /></span>Read the DNA</h3>
          <p>Technology stack, language composition, project characteristics, and health observations, all derived from actual repository files.</p>
        </div>
      </section>
    </main>
  )
}
