import type { Scene } from './scene/schema'

export type GenerateStats = {
  model: string
  repairs: number
  latencyMs: number
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number }
}

type StreamLine =
  | { type: 'status'; message: string }
  | { type: 'scene'; scene: Scene; fixes: string[] }
  | { type: 'done'; stats: GenerateStats }
  | { type: 'error'; message: string }

/** Calls /api/generate and reports progress lines as they stream in. */
export async function generate(
  body: { prompt: string; current?: Scene },
  onStatus: (message: string) => void,
): Promise<{ scene: Scene; stats?: GenerateStats }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: `Request failed (${res.status}).` }))
    throw new Error(err.error)
  }

  let scene: Scene | undefined
  let stats: GenerateStats | undefined
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const raw of lines) {
      if (!raw.trim()) continue
      const line = JSON.parse(raw) as StreamLine
      if (line.type === 'status') onStatus(line.message)
      else if (line.type === 'scene') scene = line.scene
      else if (line.type === 'done') stats = line.stats
      else if (line.type === 'error') throw new Error(line.message)
    }
  }
  if (!scene) throw new Error('The server closed the connection before sending a scene.')
  return { scene, stats }
}
