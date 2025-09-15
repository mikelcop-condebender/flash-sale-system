"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaTest = void 0;
const client_1 = require("@prisma/client");
exports.prismaTest = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.TEST_DATABASE_URL,
        },
    },
});
