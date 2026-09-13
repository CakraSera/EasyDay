import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client.js'

export const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL ?? ''),
})

/** PRD v1 ADR 0002: one implicit user, no auth. */
export const DEMO_USER_ID = 'demo'

/** Ensure the singleton `demo` user row exists. Idempotent. */
export async function ensureDemoUser(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: { id: DEMO_USER_ID },
  })
}
