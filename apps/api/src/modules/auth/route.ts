import { OpenAPIHono } from '@hono/zod-openapi'
import {
  AuthHeaderSchema,
  AuthLoginSchema,
  AuthLoginSuccessSchema,
  AuthMeSchema,
  AuthRegisterSchema,
} from './schema.js'
import { checkAuthorized } from './middleware.js'
import { prisma } from '../../db.js'
import { hash, verify } from 'argon2'
import { signToken } from '../../lib/token.js'
import type { User } from '../../generated/prisma/client.js'

export const authRoute = new OpenAPIHono<{ Variables: { user: User } }>()

authRoute.openapi(
  {
    method: 'post',
    path: '/register',
    request: {
      body: {
        content: { 'application/json': { schema: AuthRegisterSchema } },
      },
    },
    responses: {
      201: {
        description: 'Private data of the newly registered user',
        content: { 'application/json': { schema: AuthMeSchema } },
      },
      400: {
        description: 'Register user failed (validation or email/username already taken)',
      },
    },
  },
  async (c) => {
    const body = c.req.valid('json')

    try {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          fullName: body.fullName,
          username: body.username,
          passwordHash: await hash(body.password),
        },
      })
      return c.json(toPrivateUser(user), 201)
    } catch {
      // P2002 unique violation on email/username, or other store failure.
      return c.json({ message: 'Register user failed' }, 400)
    }
  },
)

authRoute.openapi(
  {
    method: 'post',
    path: '/login',
    request: {
      body: { content: { 'application/json': { schema: AuthLoginSchema } } },
    },
    responses: {
      200: {
        description: 'Login success',
        content: { 'application/json': { schema: AuthLoginSuccessSchema } },
      },
      404: {
        description: 'Email is not registered',
      },
      400: {
        description: 'Password invalid',
      },
    },
  },
  async (c) => {
    const body = c.req.valid('json')

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user?.passwordHash) return c.notFound()

    if (!(await verify(user.passwordHash, body.password))) {
      return c.json({ message: 'Password invalid' }, 400)
    }

    return c.json({ token: await signToken(user.id) })
  },
)

authRoute.openapi(
  {
    method: 'get',
    path: '/me',
    request: { headers: AuthHeaderSchema },
    middleware: [checkAuthorized],
    responses: {
      200: {
        description: 'Authenticated user',
        content: { 'application/json': { schema: AuthMeSchema } },
      },
      401: {
        description: 'Missing or invalid bearer token',
      },
    },
  },
  async (c) => {
    const user = c.get('user')
    return c.json(toPrivateUser(user))
  },
)

type PrivateUser = {
  id: string
  fullName: string | null
  email: string | null
  username: string | null
  createdAt: Date
}

function toPrivateUser(user: PrivateUser) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  }
}
