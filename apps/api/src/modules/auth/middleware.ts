import { createMiddleware } from 'hono/factory'
import type { User } from '../../generated/prisma/client.js'
import { prisma } from '../../db.js'
import { verifyToken } from '../../lib/token.js'

type Env = {
  Variables: {
    user: User
  }
}

/**
 * `Authorization: Bearer <token>` → `c.set("user", User)`.
 * Any missing/invalid step answers 401 and never calls next().
 */
export const checkAuthorized = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ message: 'Authorization header is required' }, 401)

  const token = authHeader.split(' ')[1]
  if (!token) return c.json({ message: 'Token is required' }, 401)

  const payload = await verifyToken(token)
  if (!payload) return c.json({ message: 'Invalid token' }, 401)

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) return c.json({ message: 'User is no longer available' }, 401)

  c.set('user', user)
  await next()
})
