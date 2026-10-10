import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { MODELS, GenerateError, generateScene, type GenerateEvent } from './generateScene.js'

const Body = z.object({
  prompt: z.string().trim().min(1).max(500),
  current: z.any().optional(),
  model: z.enum(Object.keys(MODELS) as [keyof typeof MODELS]).optional(),
})

// Best-effort per-IP limit. Serverless instances don't share memory, so this
// slows down a single abuser rather than enforcing a global quota; the hard
// ceiling is the monthly spend limit set on the Anthropic API key.
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_PER_HOUR ?? 20)
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** POST /api/generate → NDJSON stream of GenerateEvent, then a final `done` or `error` line. */
export async function handleGenerate(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: 'Live generation is not configured. Try the examples.' })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local'
  if (rateLimited(ip)) return json(429, { error: 'Rate limit reached. Try again in an hour, or browse the examples.' })

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json(400, { error: 'Send {"prompt": "..."} (max 500 characters).' })

  const client = new Anthropic()
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (line: GenerateEvent | { type: 'done' | 'error'; [k: string]: unknown }) =>
        controller.enqueue(encoder.encode(JSON.stringify(line) + '\n'))
      try {
        const { stats } = await generateScene(client, parsed.data, send)
        console.log(JSON.stringify({ event: 'generate', prompt: parsed.data.prompt, ...stats }))
        send({ type: 'done', stats })
      } catch (err) {
        const message =
          err instanceof GenerateError
            ? err.message
            : err instanceof Anthropic.RateLimitError
              ? 'The model is busy right now. Try again in a minute.'
              : 'Something went wrong generating the scene.'
        if (!(err instanceof GenerateError)) console.error(err)
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' } })
}
