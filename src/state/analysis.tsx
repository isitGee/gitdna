import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Analysis, AnalysisStage } from '../types'
import { analyzeRepository, GitHubError } from '../lib/github-reexport'

const STAGES: { id: string; label: string }[] = [
  { id: 'connect', label: 'Connecting to GitHub' },
  { id: 'structure', label: 'Reading repository structure' },
  { id: 'tech', label: 'Analyzing technologies' },
  { id: 'map', label: 'Mapping relationships' },
  { id: 'files', label: 'Identifying important files' },
  { id: 'dna', label: 'Building repository DNA' },
]

interface AnalysisState {
  status: 'idle' | 'analyzing' | 'ready' | 'error'
  stages: AnalysisStage[]
  analysis: Analysis | null
  errorKind: string | null
  errorRepo: string | null
  currentRepo: string | null
  loadRepo: (owner: string, name: string) => Promise<void>
  reset: () => void
}

const Ctx = createContext<AnalysisState | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AnalysisState['status']>('idle')
  const [stages, setStages] = useState<AnalysisStage[]>(STAGES.map((s) => ({ ...s, done: false, active: false })))
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [errorKind, setErrorKind] = useState<string | null>(null)
  const [errorRepo, setErrorRepo] = useState<string | null>(null)
  const [currentRepo, setCurrentRepo] = useState<string | null>(null)
  const runId = useRef(0)

  const setStageActive = (idx: number) => {
    setStages((prev) => prev.map((s, i) => ({ ...s, active: i === idx, done: i < idx })))
  }

  const loadRepo = useCallback(async (owner: string, name: string) => {
    const id = ++runId.current
    setStatus('analyzing')
    setAnalysis(null)
    setErrorKind(null)
    setErrorRepo(null)
    setCurrentRepo(`${owner}/${name}`)
    setStages(STAGES.map((s) => ({ ...s, done: false, active: false })))
    const started = Date.now()
    try {
      const result = await analyzeRepository(owner, name, (idx) => { if (runId.current === id) setStageActive(idx) })
      // keep the sequence feeling deliberate but never slow: min ~1.6s total
      const elapsed = Date.now() - started
      if (elapsed < 1600) await new Promise((r) => setTimeout(r, 1600 - elapsed))
      if (runId.current !== id) return
      setStages(STAGES.map((s) => ({ ...s, done: true, active: false })))
      await new Promise((r) => setTimeout(r, 260))
      if (runId.current !== id) return
      setAnalysis(result)
      setStatus('ready')
    } catch (e) {
      if (runId.current !== id) return
      const kind = e instanceof GitHubError ? e.kind : 'unknown'
      setErrorKind(kind)
      setErrorRepo(`${owner}/${name}`)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    runId.current++
    setStatus('idle')
    setAnalysis(null)
    setErrorKind(null)
    setCurrentRepo(null)
  }, [])

  return (
    <Ctx.Provider value={{ status, stages, analysis, errorKind, errorRepo, currentRepo, loadRepo, reset }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAnalysis(): AnalysisState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider')
  return ctx
}
