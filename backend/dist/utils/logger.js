"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logPerformance = exports.loggers = exports.createLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
    // Pretty print in development, structured JSON in production
    transport: isDevelopment
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
                levelFirst: true,
                messageFormat: "{levelLabel} - {msg}",
                timestampKey: "time",
            },
        }
        : undefined,
    // Disable logging in test environment unless explicitly enabled
    enabled: !isTest || process.env.ENABLE_TEST_LOGGING === "true",
    // Base configuration
    base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME || "localhost",
    },
    // Custom serializers for better error logging
    serializers: {
        err: pino_1.default.stdSerializers.err,
        req: pino_1.default.stdSerializers.req,
        res: pino_1.default.stdSerializers.res,
    },
    // Custom formatters
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
});
// Create child loggers for different modules
const createLogger = (module) => {
    return exports.logger.child({ module });
};
exports.createLogger = createLogger;
// Utility functions for structured logging
exports.loggers = {
    purchase: (0, exports.createLogger)("purchase"),
    queue: (0, exports.createLogger)("queue"),
    api: (0, exports.createLogger)("api"),
    database: (0, exports.createLogger)("database"),
    cache: (0, exports.createLogger)("cache"),
    system: (0, exports.createLogger)("system"),
};
// Performance logging helper
const logPerformance = (operation, startTime, metadata) => {
    const duration = Date.now() - startTime;
    exports.logger.info({
        operation,
        duration,
        ...metadata,
    }, `Operation completed: ${operation} (${duration}ms)`);
};
exports.logPerformance = logPerformance;
// Error logging with context
const logError = (error, context) => {
    exports.logger.error({
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        ...context,
    }, `Error occurred: ${error.message}`);
};
exports.logError = logError;
