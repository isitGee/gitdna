import { renderToString } from 'react-dom/server'
import { makeFixtureAnalysis } from './fixtures'
import { Landing } from '../src/components/Landing'
import { DNAView, HealthPanel, ImportantFilesPanel, OverviewCards } from '../src/components/dna/DNAView'
import { MapView } from '../src/components/map/MapView'
import { GuideView } from '../src/components/guide/GuideView'
import { SearchOverlay } from '../src/components/SearchOverlay'
import { ShareDialog } from '../src/components/ShareDialog'
import { EmptyState, ErrorState } from '../src/components/States'
import { AnalysisProvider } from '../src/state/analysis'
import { ToastHost } from '../src/components/shared/ToastHost'
import { Nav } from '../src/components/Nav'
import { AnalysisSequence } from '../src/components/AnalysisSequence'

// minimal browser shims for renderToString
;(globalThis as any).window = globalThis
;(globalThis as any).location = { hash: '#/', origin: 'https://gitdna.dev', pathname: '/' }
;(globalThis as any).navigator = { clipboard: { writeText: async () => {} } }
;(globalThis as any).addEventListener = () => {}
;(globalThis as any).removeEventListener = () => {}
;(globalThis as any).matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} })
;(globalThis as any).HashChangeEvent = class {}

const demo = makeFixtureAnalysis()
let failures = 0
const check = (name: string, fn: () => string) => {
  try {
    const html = fn()
    if (!html || html.length < 100) throw new Error('empty render')
    console.log(`PASS ${name} (${html.length} chars)`)
  } catch (e) {
    failures++
    console.log(`FAIL ${name}: ${(e as Error).message}`)
  }
}

check('Landing (hero + sample analysis)', () => renderToString(
  <AnalysisProvider><ToastHost><Landing /></ToastHost></AnalysisProvider>))
check('Nav', () => renderToString(<AnalysisProvider><Nav /></AnalysisProvider>))
check('Overview cards', () => renderToString(<OverviewCards analysis={demo} />))
check('DNA view', () => renderToString(<DNAView analysis={demo} />))
check('Important files + explain', () => renderToString(<ImportantFilesPanel analysis={demo} showExplain />))
check('Health panel', () => renderToString(<HealthPanel analysis={demo} />))
check('Map view (full)', () => renderToString(<MapView analysis={demo} />))
check('Map view (embedded)', () => renderToString(<MapView analysis={demo} embedded />))
check('Guide view', () => renderToString(<GuideView analysis={demo} onOpenInMap={() => {}} />))
check('Search overlay', () => renderToString(<SearchOverlay items={[{ id: 'a', name: 'src/main.js', kind: 'File', detail: 'entry', nodeId: 'file:src/main.js' }]} onSelect={() => {}} onClose={() => {}} />))
check('Share dialog', () => renderToString(<ToastHost><ShareDialog analysis={demo} onClose={() => {}} /></ToastHost>))
check('Empty state', () => renderToString(<EmptyState onDemo={() => {}} />))
check('Error states', () => ['notFound', 'rateLimit', 'empty', 'network', null].map((k) => renderToString(<ErrorState kind={k} onDemo={() => {}} />)).join(''))
check('Analysis sequence', () => renderToString(<AnalysisProvider><AnalysisSequence /></AnalysisProvider>))

// technology stack uses official brand marks, not initials
const techHtml = renderToString(<DNAView analysis={demo} />)
const hasSvgMark = /<svg[^>]*role="img"[^>]*aria-label="(JavaScript|HTML|CSS) logo"/.test(techHtml)
if (!hasSvgMark) { failures++; console.log('FAIL tech stack missing official brand logos') }
else console.log('PASS tech stack renders official brand logos')
if (/>JA<|>HT<|>CS</.test(techHtml)) { failures++; console.log('FAIL tech tiles still show initials') }

// landing is honest: no sample/demo scaffolding, real product copy instead
const landingHtml = renderToString(<AnalysisProvider><ToastHost><Landing /></ToastHost></AnalysisProvider>)
for (const m of ['Understand any GitHub repository.', 'Public repositories only', 'Paste a repository', 'Read the DNA', 'Explore and share']) {
  if (!landingHtml.includes(m)) { failures++; console.log(`FAIL Landing missing: ${m}`) }
}
if (landingHtml.includes('Sample analysis') || landingHtml.toLowerCase().includes('demo')) {
  failures++; console.log('FAIL Landing still contains demo/sample scaffolding')
}

// unit: guide test step must not duplicate the core folder when tests live inside it
import('../src/lib/guide').then(async ({ buildGuide }) => {
  const meta = { owner: 'o', name: 'r', fullName: 'o/r', description: '', htmlUrl: 'https://github.com/o/r', stars: 0, forks: 0, primaryLanguage: 'TypeScript', sizeKb: 10, updatedAt: '2026-01-01T00:00:00Z', license: null, defaultBranch: 'main', topics: [], openIssues: 0 }
  const mk = (path: string) => { const slash = path.lastIndexOf('/'); const dot = path.lastIndexOf('.'); return { path, name: path.slice(slash + 1), dir: slash >= 0 ? path.slice(0, slash) : '', ext: dot > slash ? path.slice(dot + 1) : '', size: 10 } }
  const files = [mk('README.md'), mk('src/main.ts'), mk('src/app/ui.ts'), mk('src/tests/app.test.ts'), mk('src/tests/ui.test.ts')]
  const guide = buildGuide({ meta, files, readme: files[0], entryPoints: [files[1]], topFolders: [{ path: 'src', name: 'src', files: 4, bytes: 40, purpose: 'p', languages: [] }], testFiles: [files[3], files[4]], configFiles: [] })
  const testStep = guide.find((g) => g.role === 'Tests')
  if (!testStep) { failures++; console.log('FAIL no test step generated') }
  else if (testStep.path === 'src') { failures++; console.log('FAIL test step duplicates core folder') }
  else console.log(`PASS guide test step points at ${testStep?.path}`)
  console.log(failures === 0 ? 'ALL RENDER TESTS PASSED' : `${failures} FAILURES`)
  process.exit(failures === 0 ? 0 : 1)
})
