// PrismaClientのシングルトン
// Next.jsの開発モードはホットリロードのたびにモジュールを再読込するため、
// 素朴にnewするとDB接続が増え続ける。globalに1つだけ保持するのが定石。
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
