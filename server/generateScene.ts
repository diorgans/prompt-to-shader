import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { catalogText } from '../src/scene/catalog'
import { MAX_LAYERS, ModelScene, toModelScene, validateScene, type Scene } from '../src/scene/schema'

export const MODELS = {
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
  haiku: 'claude-haiku-5-5',
} as const
export type ModelKey = keyof typeof MODELS

// Server-side refusal fallback is available for Opus/Sonnet; Haiku has none.
const SUPPORTS_FALLBACK: Record<ModelKey, boolean> = { opus: true, sonnet: true, haiku: false }

const MAX_REPAIRS = 2

// Frozen at module load: byte-identical across requests so the ~7k-token catalog
// is served from the prompt cache after the first call.
const SYSTEM_PROMPT = `You are an art director who composes animated WebGPU shader scenes from text prompts.

A scene is a bottom-to-top stack of up to ${MAX_LAYERS} layers drawn from the catalog below.
- The first layer must be a generator. Filters transform everything beneath them, so order matters: put color/blur filters before texture filters like FilmGrain or Halftone when you want the texture to stay crisp.
- Prefer 2-4 layers. Every layer should earn its place; restraint usually looks better.
- Set colors deliberately. Pick a palette that matches the mood, and write it into the generator's colors or stops.
- Only set props you want to change; everything else keeps its library default. Respect each prop's range.
- Use Text only if the prompt asks for words on screen, and at most once.
- If the prompt asks for something the catalog cannot depict literally (a cat, a logo), evoke it through color, motion and texture instead, and say so in the rationale.
- Write values as strings: numbers like "0.8", booleans "true", positions "0.5,0.3", stops "#112233,#445566,#778899".

# Catalog
${catalogText()}`

export type GenerateEvent =
  | { type: 'status'; message: string }
  | { type: 'scene'; scene: Scene; fixes: string[] }

export type GenerateRequest = {
  prompt: string
  /** Current scene, when the user is refining rather than starting fresh. */
  current?: Scene
  model?: ModelKey
  effort?: 'low' | 'medium' | 'high'
}

export type GenerateStats = {
  model: string
  repairs: number
  firstTryValid: boolean
  fixes: string[]
  latencyMs: number
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number }
}

export class GenerateError extends Error {}

function userMessage({ prompt, current }: GenerateRequest): string {
  if (!current) return `Prompt: ${prompt}`
  return `Here is the current scene:\n${JSON.stringify(toModelScene(current))}\n\nRevise it per this request, keeping what already works: ${prompt}`
}

export async function generateScene(
  client: Anthropic,
  req: GenerateRequest,
  onEvent: (e: GenerateEvent) => void = () => {},
): Promise<{ scene: Scene; stats: GenerateStats }> {
  const modelKey = req.model ?? 'opus'
  const model = MODELS[modelKey]
  const started = Date.now()
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: userMessage(req) }]
  let firstTryValid = false

  for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
    onEvent({ type: 'status', message: attempt === 0 ? 'Composing scene…' : `Repairing (attempt ${attempt})…` })

    const response = await client.beta.messages.parse({
      model,
      max_tokens: 8000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
      output_config: { effort: req.effort ?? 'medium', format: zodOutputFormat(ModelScene) },
      ...(SUPPORTS_FALLBACK[modelKey] ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    })

    usage.input += response.usage.input_tokens
    usage.output += response.usage.output_tokens
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0

    if (response.stop_reason === 'refusal') throw new GenerateError('The model declined this prompt. Try rephrasing it.')
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      throw new GenerateError('The model returned an incomplete scene. Try again.')
    }

    const { scene, errors, fixes } = validateScene(response.parsed_output)
    if (errors.length === 0) {
      if (attempt === 0) firstTryValid = true
      onEvent({ type: 'scene', scene, fixes })
      return {
        scene,
        stats: { model, repairs: attempt, firstTryValid, fixes, latencyMs: Date.now() - started, usage },
      }
    }

    // Append-only history: keep the model's full turn (including thinking blocks)
    // and add specific feedback, so it can correct itself without starting over.
    messages.push({ role: 'assistant', content: response.content })
    messages.push({
      role: 'user',
      content: `That scene failed validation:\n- ${errors.join('\n- ')}\nReturn a corrected scene.`,
    })
  }

  throw new GenerateError('Could not produce a valid scene. Try a simpler prompt.')
}
