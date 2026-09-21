import { useEffect } from 'react'
import { useRoute, navigate } from './router'
import { AnalysisProvider, useAnalysis } from './state/analysis'
import { ToastHost } from './components/shared/ToastHost'
import { ThemeProvider } from './state/theme'
import { Nav } from './components/Nav'
import { Landing } from './components/Landing'
import { Workspace } from './components/Workspace'
import { AnalysisSequence } from './components/AnalysisSequence'
import { EmptyState, ErrorState } from './components/States'

function Routes() {
  const route = useRoute()
  const { status, loadRepo, reset, errorKind } = useAnalysis()

  useEffect(() => {
    if (route.page === 'repo' && status !== 'analyzing') {
      loadRepo(route.owner, route.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.page, route.page === 'repo' ? `${route.owner}/${route.name}` : ''])

  useEffect(() => {
    if (route.page === 'landing') reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.page])

  useEffect(() => { window.scrollTo(0, 0) }, [route.page, route.page === 'repo' ? `${(route as any).owner}/${(route as any).name}` : ''])

  const goHome = () => navigate('/')

  if (route.page === 'landing') {
    return (
      <>
        <Nav />
        <Landing />
        <footer className="footer">
          <div className="f-brand">gitDNA</div>
          <div className="f-tag">Understand the code before you touch it.</div>
          <div className="f-links">
            <a href="#how">How it works</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </footer>
      </>
    )
  }

  if (status === 'analyzing') {
    return (
      <>
        <Nav />
        <AnalysisSequence />
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        <Nav />
        <div className="workspace">
          <ErrorState kind={errorKind} />
        </div>
      </>
    )
  }

  if (status === 'ready') {
    return (
      <>
        <Nav />
        <WorkspaceInner onHome={goHome} />
      </>
    )
  }

  return (
    <>
      <Nav />
      <div className="workspace">
        <EmptyState />
      </div>
    </>
  )
}

function WorkspaceInner({ onHome }: { onHome: () => void }) {
  const { analysis } = useAnalysis()
  useEffect(() => {
    if (analysis) document.title = `gitDNA — ${analysis.repo.fullName}`
    return () => { document.title = 'gitDNA — Understand the code before you touch it' }
  }, [analysis])
  if (!analysis) return null
  return <Workspace analysis={analysis} onNewAnalysis={onHome} />
}

export default function App() {
  return (
    <ThemeProvider>
      <AnalysisProvider>
        <ToastHost>
          <Routes />
        </ToastHost>
      </AnalysisProvider>
    </ThemeProvider>
  )
}
