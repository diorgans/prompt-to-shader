// Generate one scene from the command line, for curating examples and debugging.
// Usage: npx tsx --env-file=.env.local scripts/generate.mts "your prompt" [opus|sonnet|haiku]
import Anthropic from '@anthropic-ai/sdk'
import { generateScene, type ModelKey } from '../server/generateScene'
import { toModelScene } from '../src/scene/schema'

const [prompt, model = 'opus'] = process.argv.slice(2)
if (!prompt) {
  console.error('Usage: scripts/generate.mts "prompt" [opus|sonnet|haiku]')
  process.exit(1)
}

const { scene, stats } = await generateScene(new Anthropic(), { prompt, model: model as ModelKey })
const encoded = Buffer.from(JSON.stringify(toModelScene(scene))).toString('base64url')
console.log(JSON.stringify({ prompt, scene: toModelScene(scene) }, null, 2))
console.error(`\n${stats.model} · ${(stats.latencyMs / 1000).toFixed(1)}s · ${stats.repairs} repairs`)
console.error(`View: http://localhost:5181/#s=${encoded}`)
