import { useEffect, useState } from 'react'
import { generatePresetCode } from 'shaders/react/codegen'
import { generate, type GenerateStats } from './api'
import { examples } from './examples'
import { PropsPanel } from './PropsPanel'
import { SceneView } from './SceneView'
import { toPreset, type Scene } from './scene/schema'
import { decodeScene, shareUrl } from './share'
import { useReadAloud } from './speech'

function initialScene(): Scene {
  const match = location.hash.match(/^#s=(.+)$/)
  return (match && decodeScene(match[1])) || examples[0].scene
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function Studio() {
  const [scene, setScene] = useState<Scene>(initialScene)
  const [sceneKey, setSceneKey] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()
  const [stats, setStats] = useState<GenerateStats>()
  const [toast, setToast] = useState<string>()
  const busy = status !== undefined
  const reader = useReadAloud(`${scene.title}. ${scene.rationale}`)

  // Load a share link pasted into an already-open tab.
  useEffect(() => {
    const onHash = () => {
      const match = location.hash.match(/^#s=(.+)$/)
      const shared = match && decodeScene(match[1])
      if (shared) {
        setScene(shared)
        setSceneKey((k) => k + 1)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(undefined), 2000)
    return () => clearTimeout(t)
  }, [toast])

  function show(next: Scene) {
    setScene(next)
    setSceneKey((k) => k + 1) // new stack → remount so layers restack in order
    history.replaceState(null, '', '#')
  }

  async function run(refine: boolean) {
    const text = prompt.trim()
    if (!text || busy) return
    setError(undefined)
    setStatus('Sending…')
    try {
      const result = await generate({ prompt: text, current: refine ? scene : undefined }, setStatus)
      show(result.scene)
      setStats(result.stats)
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setStatus(undefined)
    }
  }

  function updateProp(layerIndex: number, name: string, value: unknown) {
    setScene((s) => ({
      ...s,
      layers: s.layers.map((l, i) => (i === layerIndex ? { ...l, props: { ...l.props, [name]: value } } : l)),
    }))
  }

  async function copyCode() {
    setToast((await copy(generatePresetCode(toPreset(scene)))) ? 'React code copied' : 'Copy failed: your browser blocked clipboard access')
  }

  async function copyLink() {
    const url = shareUrl(scene)
    history.replaceState(null, '', url)
    setToast((await copy(url)) ? 'Share link copied' : 'Link is in the address bar')
  }

  return (
    <div className="studio">
      <div className="stage-wrap">
        <SceneView scene={scene} sceneKey={sceneKey} className="stage" />
        {busy && <div className="busy" role="status">{status}</div>}
      </div>

      <aside className="panel">
        <header className="brand">
          <h1>Prompt-to-Shader</h1>
          <p>Describe a mood. Claude composes a live WebGPU shader for it.</p>
        </header>

        <form
          className="prompt"
          onSubmit={(e) => {
            e.preventDefault()
            run(false)
          }}
        >
          <label htmlFor="prompt" className="sr-only">Describe a scene</label>
          <textarea
            id="prompt"
            rows={3}
            maxLength={500}
            placeholder="stormy ocean at dusk, shot on film"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                run(false)
              }
            }}
          />
          <div className="actions">
            <button type="submit" disabled={busy || !prompt.trim()}>New scene</button>
            <button type="button" className="secondary" disabled={busy || !prompt.trim()} onClick={() => run(true)}>
              Refine this one
            </button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>

        <div className="chips" aria-label="Examples">
          {examples.map((ex) => (
            <button key={ex.prompt} type="button" className="chip" onClick={() => show(ex.scene)} title={ex.prompt}>
              {ex.scene.title}
            </button>
          ))}
        </div>

        <section className="about-scene">
          <h2>{scene.title}</h2>
          <p>{scene.rationale}</p>
          {stats && (
            <p className="meta">
              {stats.model} · {(stats.latencyMs / 1000).toFixed(1)}s · {stats.repairs} {stats.repairs === 1 ? 'repair' : 'repairs'} ·{' '}
              {stats.usage.cacheRead > 0 ? 'catalog cached' : 'cache warmed'}
            </p>
          )}
          <div className="actions">
            <button type="button" className="secondary" onClick={copyCode}>Copy React code</button>
            <button type="button" className="secondary" onClick={copyLink}>Copy share link</button>
            {reader && (
              <button type="button" className="secondary" onClick={reader.toggle} aria-pressed={reader.speaking}>
                {reader.speaking ? 'Stop reading' : 'Read aloud'}
              </button>
            )}
          </div>
        </section>

        <PropsPanel layers={scene.layers} onChange={updateProp} />

        <footer className="foot">
          <a href="#gallery">Effect gallery</a> · <a href="#trailer">Trailer</a>
        </footer>
      </aside>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
