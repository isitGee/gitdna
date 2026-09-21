import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://gitdna.dev/#/', pretendToBeVisual: true })
const g = globalThis as any
g.window = dom.window
g.document = dom.window.document
g.navigator = dom.window.navigator
g.HTMLElement = dom.window.HTMLElement
g.SVGElement = dom.window.SVGElement
g.Element = dom.window.Element
g.Node = dom.window.Node
g.Event = dom.window.Event
g.MouseEvent = dom.window.MouseEvent
g.KeyboardEvent = dom.window.KeyboardEvent
g.HashChangeEvent = dom.window.HashChangeEvent
g.getComputedStyle = dom.window.getComputedStyle
g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0)
g.cancelAnimationFrame = clearTimeout
g.IS_REACT_ACT_ENVIRONMENT = true
// jsdom lacks layout; stub getBoundingClientRect for the map fit logic
dom.window.Element.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: 1200, bottom: 700, width: 1200, height: 700, toJSON: () => ({}) }) as any
g.PointerEvent = dom.window.MouseEvent

import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'
import { makeFixtureAnalysis } from './fixtures'
import { Workspace } from '../src/components/Workspace'
import { Nav } from '../src/components/Nav'
import { ThemeProvider } from '../src/state/theme'
import { AnalysisProvider } from '../src/state/analysis'
import { ToastHost } from '../src/components/shared/ToastHost'

let failures = 0
const ok = (cond: boolean, name: string) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`); if (!cond) failures++ }
const $ = (sel: string) => document.querySelector(sel)
const $$ = (sel: string) => [...document.querySelectorAll(sel)]
const click = (el: any) => act(() => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
const text = () => document.body.textContent ?? ''

async function main() {
  const demo = makeFixtureAnalysis()
  const root = createRoot(document.getElementById('root')!)
  await act(async () => {
    root.render(
      React.createElement(AnalysisProvider, null,
        React.createElement(ToastHost, null,
          React.createElement(Workspace, { analysis: demo, onNewAnalysis: () => {} }))))
  })

  ok(text().includes('geedesk'), 'repo header shows owner and name')
  ok(!!$('.repo-header h1 a'), 'repo header links to GitHub')
  ok(text().includes('Project identity'), 'DNA view is default')
  ok(text().includes('Repository health'), 'health panel rendered')

  // switch to Map
  const mapTab = $$('button[role="tab"]').find((b) => b.textContent === 'Map')!
  click(mapTab)
  await act(async () => { await new Promise((r) => setTimeout(r, 50)) })
  ok(!!$('.map-shell'), 'map shell rendered')
  const nodes = $$('.graph-node')
  ok(nodes.length >= 10, `map has ${nodes.length} nodes`)

  // click a node -> detail panel
  const srcNode = nodes.find((n) => n.getAttribute('aria-label')?.includes('src'))!
  click(srcNode)
  await act(async () => {})
  ok(!!$('.detail-panel'), 'detail panel opens on node click')
  ok(text().includes('Why it matters'), 'detail panel shows why it matters')
  ok(text().includes('Explain this'), 'Explain this action present')
  ok(text().includes('Open on GitHub'), 'detail panel offers Open on GitHub')

  // Explain this
  const explainBtn = $$('button').find((b) => b.textContent?.includes('Explain this'))!
  click(explainBtn)
  await act(async () => {})
  ok(text().includes('In plain English'), 'explanation expands')
  ok(text().includes('What does this do?'), 'structured explanation present')

  // search overlay via keyboard shortcut path: click Search button
  const searchBtn = $$('button').find((b) => b.textContent?.includes('Search'))!
  click(searchBtn)
  await act(async () => {})
  ok(!!$('.search-dialog'), 'search overlay opens')
  const input = $('.search-dialog input') as HTMLInputElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, 'components')
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  })
  await act(async () => {})
  const results = $$('.search-result')
  ok(results.length > 0, `search finds ${results.length} results for components`)
  click(results[0])
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  ok(!$('.search-dialog'), 'search closes after selection')
  ok(!!$('.map-shell'), 'map shown after search selection')
  ok(!!$('.detail-panel'), 'selected node detail panel opens from search')

  // Guide view
  const guideTab = $$('button[role="tab"]').find((b) => b.textContent === 'Guide')!
  click(guideTab)
  await act(async () => {})
  ok(text().includes('Exploration path'), 'guide path rendered')
  const stepCard = $('.path-card') as HTMLElement
  click(stepCard)
  await act(async () => {})
  ok(text().includes('Why look at it'), 'guide step expands')

  // theme toggle (mount the real Nav inside a ThemeProvider)
  const navHost = document.createElement('div')
  document.body.appendChild(navHost)
  const navRoot = createRoot(navHost)
  await act(async () => {
    navRoot.render(React.createElement(ThemeProvider, null, React.createElement(Nav)))
  })
  const findToggle = () => [...navHost.querySelectorAll('button')].find((b) => /mode/.test(b.getAttribute('aria-label') ?? ''))
  const themeBtn = findToggle()
  ok(!!themeBtn, 'theme toggle exists in nav')
  if (themeBtn) {
    const before = document.documentElement.dataset.theme
    click(themeBtn)
    await act(async () => {})
    ok(document.documentElement.dataset.theme !== before, `theme toggles (${before} -> ${document.documentElement.dataset.theme})`)
    click(findToggle()!)
    await act(async () => {})
    ok(document.documentElement.dataset.theme === before, 'theme toggles back')
  }

  // Share dialog
  const shareBtn = $$('button').find((b) => b.textContent?.includes('Share analysis'))!
  click(shareBtn)
  await act(async () => {})
  ok(text().includes('gitdna.dev/github/geedesk/geedesk'), 'share dialog shows gitDNA link')
  ok(text().includes('README badge'), 'share dialog shows README badge')

  console.log(failures === 0 ? 'ALL DOM TESTS PASSED' : `${failures} FAILURES`)
  process.exit(failures === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
