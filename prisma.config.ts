import path from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { defineConfig } from 'prisma/config'

const url =
  process.env.DATABASE_URL ??
  'postgresql://easyday:easyday@127.0.0.1:54329/easyday'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  datasource: { url },
  migrate: {
    adapter: async () => new PrismaPg(url),
  },
})
