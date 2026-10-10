import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// The shader renderer sizes its canvas by devicePixelRatio (up to 2×). On Retina
// screens that quadruples GPU work and drops frames, so report a lower ratio to
// it. CSS layout and text are unaffected; only scripts read this value.
const MAX_SHADER_DPR = Number(new URLSearchParams(location.search).get('dpr')) || 1
const dprDescriptor =
  Object.getOwnPropertyDescriptor(window, 'devicePixelRatio') ??
  Object.getOwnPropertyDescriptor(Window.prototype, 'devicePixelRatio')
if (dprDescriptor?.get) {
  const nativeDpr = dprDescriptor.get
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    get: () => Math.min(nativeDpr.call(window), MAX_SHADER_DPR),
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
