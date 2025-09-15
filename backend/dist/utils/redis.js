"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis = __importStar(require("redis"));
const logger_1 = require("./logger");
const redisClient = redis.createClient({
    url: process.env.TEST_REDIS_URL ||
        process.env.REDIS_URL ||
        "redis://localhost:6379",
});
exports.redisClient = redisClient;
redisClient.on("error", (error) => {
    logger_1.logger.error(`Redis error: ${error}`);
});
redisClient.on("connect", () => {
    logger_1.logger.info("Redis client connected");
});
(async function checkRedisConnection() {
    try {
        await redisClient.connect();
        await redisClient.ping();
    }
    catch (err) {
        logger_1.logger.error(`Failed to connect to Redis: ${err}`);
        process.exit(1);
    }
})();
