import { navigate, useRoute } from '../router'
import { LogoMark } from './shared/icons'
import { useTheme } from '../state/theme'
import { useAnalysis } from '../state/analysis'
import { parseRepoUrl } from '../lib/format'

function SunIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" /></svg>
}
function MoonIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" /></svg>
}

export function Nav() {
  const route = useRoute()
  const { theme, toggle } = useTheme()
  const goHome = () => navigate('/')

  return (
    <nav className="topnav" aria-label="Main">
      <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); goHome() }} aria-label="gitDNA home">
        <LogoMark />
        <span><span className="git">git</span>DNA</span>
      </a>
      <div className="nav-links">
        <a href="#product" onClick={navScroll('#product')}>Product</a>
        <a href="#how" onClick={navScroll('#how')}>How it works</a>
        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
      </div>
      <div className="nav-spacer" />
      <button
        className="btn theme-toggle"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>
      {route.page !== 'landing'
        ? <button className="btn btn-primary" onClick={goHome}>Analyze a repository</button>
        : <button className="btn btn-primary" onClick={() => document.getElementById('repo-url')?.focus()}>Analyze</button>}
    </nav>
  )
}

function navScroll(sel: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    if (!window.location.hash.startsWith('#/')) navigate('/')
    setTimeout(() => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' }), 30)
  }
}
