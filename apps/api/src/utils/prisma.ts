// Prisma client for the demo Week record. Generated client lives in
// src/generated/prisma (prisma-client generator), Postgres via adapter-pg.
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
