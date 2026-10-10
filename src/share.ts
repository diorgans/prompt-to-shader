import { validateScene, toModelScene, ModelScene, type Scene } from './scene/schema'

// Scenes live entirely in the URL hash, so share links need no database.
// Encoded in the compact model format and re-validated on load, so a hand-edited
// link can't inject props the renderer doesn't accept.

const toBase64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const fromBase64Url = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))

export function encodeScene(scene: Scene): string {
  return toBase64Url(JSON.stringify(toModelScene(scene)))
}

export function decodeScene(encoded: string): Scene | undefined {
  try {
    const parsed = ModelScene.safeParse(JSON.parse(fromBase64Url(encoded)))
    if (!parsed.success) return undefined
    const { scene, errors } = validateScene(parsed.data)
    return errors.length ? undefined : scene
  } catch {
    return undefined
  }
}

export function shareUrl(scene: Scene): string {
  return `${location.origin}${location.pathname}#s=${encodeScene(scene)}`
}
