import { handleGenerate } from '../server/handler'

export function POST(request: Request) {
  return handleGenerate(request)
}
