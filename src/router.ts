import { useEffect, useState } from 'react'

export type Route =
  | { page: 'landing' }
  | { page: 'repo'; owner: string; name: string }

export function parseHash(hash: string): Route {
  const m = hash.replace(/^#\/?/, '').split('/')
  if (m[0] === 'github' && m[1] && m[2]) return { page: 'repo', owner: m[1], name: m[2] }
  return { page: 'landing' }
}

export function navigate(path: string) {
  window.location.hash = path
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
