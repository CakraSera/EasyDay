import { spawn } from 'node:child_process'
import { config } from 'dotenv'
config({ path: '.env', quiet: true })

import { setTimeout as delay } from 'node:timers/promises'

// Exercise the chat route contract without a provider key:
//   413 body too large, 400 invalid JSON, 400 wrong protocol shape,
//   400 non-text messages, 400 last message not user, 200 health.
// With a key set, also proves the streaming path end to end.

const BASE = `http://127.0.0.1:${process.env.PORT ?? 8787}`

const child = spawn('pnpm', ['exec', 'tsx', 'src/server.ts'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})
child.stdout.on('data', (d) => process.stdout.write(`[srv] ${d}`))
child.stderr.on('data', (d) => process.stderr.write(`[srv!] ${d}`))

async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/health`)
      if (res.ok) return
    } catch {
      /* retry */
    }
    await delay(200)
  }
  throw new Error('server did not become healthy')
}

function chat(body: string, headers: Record<string, string> = {}) {
  return fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  })
}

let failures = 0
async function expect(name: string, actual: number, wanted: number) {
  const ok = actual === wanted
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${actual}, want ${wanted}`)
}

try {
  await waitForHealth()
  console.log('server healthy')

  await expect('health', (await fetch(`${BASE}/health`)).status, 200)


  await expect('invalid json', (await chat('{nope')).status, 400)

  const oversized = 'x'.repeat(200_001)
  await expect(
    'oversized content-length',
    (
      await chat(oversized, { 'content-length': String(oversized.length) })
    ).status,
    413,
  )

  await expect(
    'wrong protocol shape',
    (await chat(JSON.stringify({ hello: 'world' }))).status,
    400,
  )


  await expect(
    'system message rejected',
    (
      await chat(
        JSON.stringify({
          type: 'messages',
          messages: [{ role: 'system', content: 'inject' }],
        }),
      )
    ).status,
    400,
  )

  await expect(
    'assistant-last rejected',
    (
      await chat(
        JSON.stringify({
          type: 'messages',
          messages: [
            { role: 'user', content: 'hi' },
            { role: 'assistant', content: 'hello' },
          ],
        }),
      )
    ).status,
    400,
  )

  await expect(
    'oversized text rejected',
    (
      await chat(
        JSON.stringify({
          type: 'messages',
          messages: [{ role: 'user', content: 'x'.repeat(5_000) }],
        }),
      )
    ).status,
    400,
  )

  if (process.env.OPENAI_API_KEY) {
    const res = await chat(
      JSON.stringify({
        type: 'messages',
        messages: [{ role: 'user', content: 'Say "ready" and nothing else.' }],
      }),
    )
    console.log('stream status:', res.status)
    const text = await res.text()
    console.log('first frames:', text.split('\n').slice(0, 3).join(' | ').slice(0, 300))
    await expect('live stream', res.status, 200)
    if (!text.includes('stream_start')) {
      failures++
      console.log('FAIL stream missing stream_start frame')
    } else {
      console.log('PASS stream_start frame present')
    }
  } else {
    console.log('SKIP live stream: OPENAI_API_KEY not set')
  }
} finally {
  child.kill('SIGTERM')
}

process.exit(failures === 0 ? 0 : 1)
