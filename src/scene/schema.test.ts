import { describe, expect, it } from 'vitest'
import { generatePresetCode } from 'shaders/react/codegen'
import { catalog, catalogText } from './catalog'
import { ModelScene, toModelScene, toPreset, validateScene } from './schema'

const scene = (layers: ModelScene['layers']): ModelScene => ({ title: 't', rationale: 'r', layers })
const p = (name: string, value: string) => ({ name, value })

describe('catalog', () => {
  it('has every curated shader with at least one generator and filter', () => {
    const roles = [...catalog.values()].map((s) => s.role)
    expect(roles).toContain('generator')
    expect(roles).toContain('filter')
  })

  it('is deterministic so the system prompt stays cacheable', () => {
    expect(catalogText()).toBe(catalogText())
  })
})

describe('validateScene', () => {
  it('accepts a valid scene and parses values by type', () => {
    const { scene: s, errors } = validateScene(
      scene([
        { type: 'Aurora', props: [p('colorA', '#22D3EE'), p('intensity', '60'), p('center', '0.5,0.3')] },
        { type: 'FilmGrain', props: [p('animated', 'true')] },
      ]),
    )
    expect(errors).toEqual([])
    expect(s.layers[0].props).toEqual({ colorA: '#22d3ee', intensity: 60, center: { x: 0.5, y: 0.3 } })
    expect(s.layers[1].props).toEqual({ animated: true })
  })

  it('clamps out-of-range numbers instead of failing', () => {
    // Aurora intensity is 0..100; models often assume 0..1 or overshoot.
    const { scene: s, errors, fixes } = validateScene(scene([{ type: 'Aurora', props: [p('intensity', '250')] }]))
    expect(errors).toEqual([])
    expect(s.layers[0].props.intensity).toBe(100)
    expect(fixes[0]).toMatch(/clamped/)
  })

  it('drops unknown props as a fix, not an error', () => {
    const { errors, fixes } = validateScene(scene([{ type: 'Plasma', props: [p('sparkliness', '9')] }]))
    expect(errors).toEqual([])
    expect(fixes[0]).toMatch(/dropped unknown prop/)
  })

  it('rejects a filter as the bottom layer', () => {
    const { errors } = validateScene(scene([{ type: 'Glitch', props: [] }]))
    expect(errors[0]).toMatch(/must be a generator/)
  })

  it('rejects bad colors, selects and too many Text layers', () => {
    const { errors } = validateScene(
      scene([
        { type: 'SolidColor', props: [p('color', 'blue')] },
        { type: 'Text', props: [p('text', 'a')] },
        { type: 'Text', props: [p('text', 'b')] },
        { type: 'FilmStock', props: [p('stock', 'kodachrome')] },
      ]),
    )
    expect(errors.join('\n')).toMatch(/hex color/)
    expect(errors.join('\n')).toMatch(/one of/)
    expect(errors.join('\n')).toMatch(/one Text layer/)
  })

  it('promotes colorA/colorB to stops on shaders whose default stops would hide them', () => {
    const { scene: s } = validateScene(scene([{ type: 'MeshGradient', props: [p('colorA', '#f97316'), p('colorB', '#ec4899')] }]))
    expect(s.layers[0].props.stops).toEqual([
      { color: '#f97316', position: 0 },
      { color: '#ec4899', position: 1 },
    ])
  })

  it('round-trips through toModelScene', () => {
    const input = scene([
      { type: 'MeshGradient', props: [p('stops', '#000000,#ffffff'), p('speed', '2')] },
      { type: 'Vignette', props: [p('center', '0.5,0.5')] },
    ])
    const first = validateScene(input).scene
    expect(validateScene(toModelScene(first)).scene).toEqual(first)
  })

  it('produces presets the library code generator accepts', () => {
    const { scene: s } = validateScene(
      scene([
        { type: 'Plasma', props: [p('colorA', '#ff0000'), p('colorB', '#0000ff')] },
        { type: 'Halftone', props: [p('frequency', '35')] },
      ]),
    )
    const code = generatePresetCode(toPreset(s))
    expect(code).toContain('<Plasma')
    expect(code).toContain('<Halftone')
  })
})
