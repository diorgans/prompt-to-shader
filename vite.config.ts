import react from '@vitejs/plugin-react'
import { Readable } from 'node:stream'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Serves /api/generate in `npm run dev` with the same handler Vercel deploys, so
// local development needs no Vercel CLI or login.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        const { handleGenerate } = await server.ssrLoadModule('/server/handler.ts')
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const request = new Request(`http://localhost${req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        })
        const response: Response = await handleGenerate(request)
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        if (response.body) Readable.fromWeb(response.body as never).pipe(res)
        else res.end()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose .env.local (e.g. ANTHROPIC_API_KEY) to the dev API only; Vite never
  // bundles non-VITE_ variables into client code.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { plugins: [react(), devApi()] }
})
