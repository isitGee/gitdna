import { analyzeRepository } from '../src/lib/analyze'

const [owner, name] = [process.argv[2] ?? 'expressjs', process.argv[3] ?? 'express']
const t0 = Date.now()
let a
try {
  a = await analyzeRepository(owner, name, (i) => console.log(`stage ${i}`))
} catch (e: any) {
  console.log(`ERROR kind=${e.kind} message=${e.message}`)
  process.exit(0)
}
console.log(`\n=== ${a.repo.fullName} in ${((Date.now() - t0) / 1000).toFixed(1)}s ===`)
console.log('files:', a.fileCount, '| size:', a.repo.sizeKb, 'KB | langs:', a.languages.map((l) => `${l.language} ${l.percent}%`).join(', '))
console.log('identity:', a.identity.summary)
console.log('tech:', a.tech.map((t) => t.name).join(', '))
console.log('folders:', a.topFolders.map((f) => f.path).join(', '))
console.log('characteristics:', a.characteristics.map((c) => c.label).join(' | '))
console.log('graph:', a.graph.nodes.length, 'nodes,', a.graph.edges.length, 'edges')
console.log('node ids:', a.graph.nodes.map((n) => n.id).join(', '))
console.log('guide:', a.guide.map((s) => `${s.path}(${s.level})`).join(' → '))
console.log('entry points:', a.entryPoints.map((f) => f.path).join(', '))
console.log('health:', a.health.map((h) => `${h.category}=${h.status}`).join(', '))
const ids = new Set(a.graph.nodes.map((n) => n.id))
console.log('dangling edges:', a.graph.edges.filter((e) => !ids.has(e.source) || !ids.has(e.target)).length)
