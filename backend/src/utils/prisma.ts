import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prismaClient = new PrismaClient();

(async function checkPrismaConnection() {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    logger.info("Connected to Database.");
  } catch (err) {
    logger.error(`Failed to connect to Database: ${err}`);
    process.exit(1);
  }
})();

export { prismaClient };
