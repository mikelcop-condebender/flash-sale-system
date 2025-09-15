import { PrismaClient } from "@prisma/client";

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL!,
    },
  },
});
