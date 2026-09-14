import { sign, verify } from 'hono/jwt'

type Payload = {
  sub: string
  exp: number
}

/** 12-hour bearer JWT, same lifetime as the fitlex reference. */
export async function signToken(userId: string): Promise<string> {
  const payload: Payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  }
  return sign(payload, tokenSecret())
}

export async function verifyToken(token: string): Promise<Payload | null> {
  try {
    const payload = (await verify(token, tokenSecret(), 'HS256')) as unknown
    if (
      payload !== null &&
      typeof payload === 'object' &&
      typeof (payload as Record<string, unknown>).sub === 'string'
    ) {
      return payload as Payload
    }
    return null
  } catch {
    return null
  }
}


function tokenSecret(): string {
  const secret = process.env.TOKEN_SECRET_KEY
  if (!secret) throw new Error('TOKEN_SECRET_KEY is not set')
  return secret
}
