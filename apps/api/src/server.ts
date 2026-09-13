import { config } from 'dotenv'
config({ path: '.env', quiet: true })

import { agentToClientStream } from '@anvia/client'
import type { ClientStreamEvent, ClientStreamRequest } from '@anvia/client'
import { createClientStreamResponse } from '@anvia/server'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { getAgent } from './agent.js'
import { DEMO_USER_ID } from './db.js'
import { authRoute } from './modules/auth/route.js'

import { RequestRejected, readChatRequest } from './request.js'
import { recordTurn } from './store.js'

const app = new Hono()

/**
 * One consumer, one tap: `recordTurn` iterates the client stream and this
 * passthrough yields each event onward to the HTTP response as it is tapped,
 * so the stream is never consumed twice.
 */
function tappedClientStream(
  stream: AsyncIterable<ClientStreamEvent>,
  tap: (event: ClientStreamEvent) => void,
): AsyncIterable<ClientStreamEvent> {
  async function* run() {
    for await (const event of stream) {
      try {
        tap(event)
      } catch {
        // A tap error must not break the client stream.
      }
      yield event
    }
  }
  return run()
}

/** Re-serve an already-observed event buffer as an async iterable. */
function eventsToStream(events: readonly ClientStreamEvent[]): AsyncIterable<ClientStreamEvent> {
  async function* run() {
    yield* events
  }
  return run()
}
app.get('/health', (context) => context.json({ ok: true }))
app.route('/auth', authRoute)

app.post('/api/chat', async (context) => {
  // PRD v1 (ADR 0002): single implicit user `demo`, no auth in v1. The userId
  // still flows into stream metadata so a later auth slice can swap this line.
  const user = { id: DEMO_USER_ID }

  let body: Extract<ClientStreamRequest, { type: 'messages' }>
  try {
    body = (await readChatRequest(context.req.raw)) as Extract<
      ClientStreamRequest,
      { type: 'messages' }
    >
  } catch (error) {
    if (error instanceof RequestRejected) return error.response
    return context.text('Invalid chat request', 400)
  }

  const threadId = threadIdFromBody(context.req.raw, body)
  const clientStream = agentToClientStream({
    events: getAgent().stream({ messages: body.messages }),
    metadata: { userId: user.id },
    mapError: () => ({
      message: 'The model request failed.',
      code: 'MODEL_REQUEST_FAILED',
      retryable: true,
    }),
  })

  // One pass over the stream: the tap observes events into a bounded buffer
  // for persistence and the passthrough feeds the HTTP response, so the
  // underlying client stream never has two concurrent consumers.
  const observedEvents: ClientStreamEvent[] = []
  let persisted = Promise.resolve()
  const tapped = tappedClientStream(clientStream, (event) => {
    observedEvents.push(event)
    if (event.type !== 'run_end') return
    const events = [...observedEvents]
    observedEvents.length = 0
    persisted = recordTurn({
      userId: user.id,
      threadId,
      messages: body.messages,
      stream: eventsToStream(events),
    })
  })

  return createClientStreamResponse({
    events: tapped,
    format: 'jsonl',
    headers: {
      'content-security-policy': "default-src 'none'",
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
    },
  })
})

/** Thread id is advisory metadata for persistence; never trusted for identity. */
function threadIdFromBody(request: Request, body: { metadata?: unknown }) {
  const header = request.headers.get('x-thread-id')
  if (typeof header === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(header)) return header
  const metadata = body.metadata
  if (
    metadata !== null &&
    typeof metadata === 'object' &&
    'threadId' in metadata &&
    typeof (metadata as Record<string, unknown>).threadId === 'string' &&
    /^[a-zA-Z0-9_-]{1,64}$/.test((metadata as Record<string, unknown>).threadId as string)
  ) {
    return (metadata as Record<string, unknown>).threadId as string
  }
  return undefined
}

const port = Number(process.env.PORT ?? 8787)
const hostname = process.env.HOST ?? '127.0.0.1'

serve({ fetch: app.fetch, hostname, port }, (info) => {
  console.log(`[easyday-backend] listening on http://${hostname}:${info.port}`)
})
