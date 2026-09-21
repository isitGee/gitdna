import { useAnalysis } from '../state/analysis'
import { CheckIcon } from './shared/icons'

export function AnalysisSequence() {
  const { stages, currentRepo } = useAnalysis()
  return (
    <div className="analysis-seq glass" role="status" aria-live="polite">
      <h2>Building repository DNA</h2>
      <div className="as-repo">{currentRepo ?? 'Analyzing repository'}</div>
      {stages.map((s) => (
        <div className={`seq-step ${s.done ? 'done' : ''} ${s.active ? 'active' : ''}`} key={s.id}>
          <span className="seq-icon">{s.done && <CheckIcon width={11} height={11} />}</span>
          {s.label}
        </div>
      ))}
    </div>
  )
}
