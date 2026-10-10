import { validateScene, type ModelScene, type Scene } from './scene/schema'

// Starter scenes shown on first load and when live generation is unavailable.
// Each pairs a prompt with a scene, so they double as example prompts.
const raw: { prompt: string; scene: ModelScene }[] = [
  {
    prompt: 'northern lights over a frozen lake, quiet and cold',
    scene: {
      title: 'Frozen Lake Aurora',
      rationale: 'Aurora in icy teal and violet for the sky, a soft vignette to pull focus, and fine grain for a long-exposure feel.',
      layers: [
        { type: 'Aurora', props: [{ name: 'colorA', value: '#6d28d9' }, { name: 'colorB', value: '#2dd4bf' }, { name: 'colorC', value: '#38bdf8' }, { name: 'speed', value: '2' }, { name: 'intensity', value: '70' }] },
        { type: 'Vignette', props: [{ name: 'intensity', value: '0.6' }] },
        { type: 'FilmGrain', props: [{ name: 'strength', value: '0.35' }, { name: 'animated', value: 'true' }] },
      ],
    },
  },
  {
    prompt: 'sunset on a 90s camcorder',
    scene: {
      title: 'Camcorder Sunset',
      rationale: 'A warm flowing gradient for the sky, run through VHS tape damage and chromatic fringing.',
      layers: [
        { type: 'FlowingGradient', props: [{ name: 'colorA', value: '#ff7849' }, { name: 'colorB', value: '#ffb86b' }, { name: 'colorC', value: '#c2185b' }, { name: 'colorD', value: '#3b0a45' }, { name: 'speed', value: '1' }] },
        { type: 'ChromaticAberration', props: [] },
        { type: 'VHS', props: [] },
      ],
    },
  },
  {
    prompt: 'a comic-book explosion of color',
    scene: {
      title: 'Pop Art Burst',
      rationale: 'High-energy plasma in primaries, printed as a halftone with a slight misregistration.',
      layers: [
        { type: 'Plasma', props: [{ name: 'stops', value: '#facc15,#ef4444,#2563eb' }] },
        { type: 'Halftone', props: [{ name: 'frequency', value: '40' }, { name: 'misprint', value: '0.006' }] },
      ],
    },
  },
  {
    prompt: 'molten chrome in a dark studio',
    scene: {
      title: 'Molten Chrome',
      rationale: 'A dark studio backdrop with liquid metal on top and a subtle glow on the highlights.',
      layers: [
        { type: 'StudioBackground', props: [{ name: 'color', value: '#0b0f19' }] },
        { type: 'LiquidMetal', props: [] },
        { type: 'Glow', props: [] },
      ],
    },
  },
  {
    prompt: 'hacker terminal, green on black',
    scene: {
      title: 'Green Terminal',
      rationale: 'Drifting noise in phosphor green, turned into ASCII and shown on a CRT.',
      layers: [
        { type: 'SimplexNoise', props: [{ name: 'colorA', value: '#000000' }, { name: 'colorB', value: '#22c55e' }] },
        { type: 'Ascii', props: [{ name: 'cellSize', value: '18' }] },
        { type: 'CRTScreen', props: [] },
      ],
    },
  },
  {
    prompt: 'calm pastel mesh for a meditation app',
    scene: {
      title: 'Pastel Drift',
      rationale: 'A slow mesh gradient in soft pastels with heavy smoothing; nothing on top, so it stays calm.',
      layers: [
        { type: 'MeshGradient', props: [{ name: 'stops', value: '#fbcfe8,#c7d2fe,#bae6fd,#d9f99d' }, { name: 'speed', value: '0.5' }, { name: 'smoothness', value: '4' }] },
      ],
    },
  },
]

export const examples: { prompt: string; scene: Scene }[] = raw.map(({ prompt, scene }) => {
  const result = validateScene(scene)
  if (result.errors.length) throw new Error(`Example "${prompt}" is invalid: ${result.errors.join('; ')}`)
  return { prompt, scene: result.scene }
})
