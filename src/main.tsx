import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { normalizeFormat, type SupportedFormat } from './formats'

declare global {
  interface Window {
    __LOCAL_MORPH_SSR__?: { target?: string | null; source?: string | null };
  }
}

const PATH_ROUTE_PATTERN = /^\/(.+?)-to-(.+?)\/?$/

function deriveTargetFromPath(pathname: string): SupportedFormat | null {
  const match = pathname.match(PATH_ROUTE_PATTERN)
  if (!match) return null
  const [, rawFrom, rawTo] = match
  const source = normalizeFormat(rawFrom)
  const target = normalizeFormat(rawTo)
  if (!source || !target || source === target) return null
  return target
}

const container = document.getElementById('root')
const ssrTarget = normalizeFormat(window.__LOCAL_MORPH_SSR__?.target ?? null)
const pathTarget = deriveTargetFromPath(window.location.pathname)
const initialTarget: SupportedFormat | null = ssrTarget ?? pathTarget ?? 'jpg'

if (container && container.hasChildNodes()) {
  hydrateRoot(
    container,
    <StrictMode>
      <App initialTargetFormat={initialTarget} />
    </StrictMode>,
  )
} else if (container) {
  createRoot(container).render(
    <StrictMode>
      <App initialTargetFormat={initialTarget} />
    </StrictMode>,
  )
}
