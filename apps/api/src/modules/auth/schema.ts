import { z } from '@hono/zod-openapi'

export const AuthRegisterSchema = z
  .object({
    fullName: z.string().min(1).openapi({ example: 'Cakra Buana' }),
    username: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_-]+$/, 'alphanumeric, dash, underscore only')
      .openapi({ example: 'cakra' }),
    email: z.email().openapi({ example: 'cakra.buana@example.com' }),
    password: z.string().min(8).openapi({ example: 'correct horse battery staple' }),
  })
  .openapi('AuthRegister')

export const AuthLoginSchema = z
  .object({
    email: z.email().openapi({ example: 'cakra.buana@example.com' }),
    password: z.string().min(1),
  })
  .openapi('AuthLogin')

export const AuthLoginSuccessSchema = z
  .object({ token: z.string() })
  .openapi('AuthLoginSuccess')

export const AuthHeaderSchema = z.object({
  authorization: z
    .string()
    .openapi({ example: 'Bearer <token>', description: 'Bearer token from /auth/login' }),
})

export const AuthMeSchema = z
  .object({
    fullName: z.string(),
    email: z.string(),
    username: z.string(),
    createdAt: z.string(),
  })
  .openapi('AuthMe')
