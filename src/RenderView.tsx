import { useEffect, useState } from 'react'
import { SceneView } from './SceneView'
import { decodeScene } from './share'

// Bare full-screen render of a shared scene (`#render=<encoded>`), used by the
// eval runner to screenshot scenes. Sets data-ready on <body> once the shader
// has had time to compile and draw, so the screenshot never captures a blank canvas.
const SETTLE_FRAMES = 60

export function RenderView({ encoded }: { encoded: string }) {
  const [scene] = useState(() => decodeScene(encoded))

  useEffect(() => {
    if (!scene) {
      document.body.dataset.ready = 'invalid'
      return
    }
    let frames = 0
    let id = requestAnimationFrame(function tick() {
      if (++frames >= SETTLE_FRAMES) document.body.dataset.ready = 'true'
      else id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [scene])

  if (!scene) return <p style={{ padding: 16 }}>Invalid scene.</p>
  return <SceneView scene={scene} className="render-full" />
}
