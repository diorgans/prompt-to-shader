import { handleGenerate } from '../server/handler.js'

export function POST(request: Request) {
  return handleGenerate(request)
}
