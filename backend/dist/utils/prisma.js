"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaClient = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prismaClient = new client_1.PrismaClient();
exports.prismaClient = prismaClient;
(async function checkPrismaConnection() {
    try {
        await prismaClient.$queryRaw `SELECT 1`;
        logger_1.logger.info("Connected to Database.");
    }
    catch (err) {
        logger_1.logger.error(`Failed to connect to Database: ${err}`);
        process.exit(1);
    }
})();
