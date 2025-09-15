import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

export const logger = pino({
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
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Custom formatters
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Utility functions for structured logging
export const loggers = {
  purchase: createLogger("purchase"),
  queue: createLogger("queue"),
  api: createLogger("api"),
  database: createLogger("database"),
  cache: createLogger("cache"),
  system: createLogger("system"),
};

// Performance logging helper
export const logPerformance = (
  operation: string,
  startTime: number,
  metadata?: any
) => {
  const duration = Date.now() - startTime;
  logger.info(
    {
      operation,
      duration,
      ...metadata,
    },
    `Operation completed: ${operation} (${duration}ms)`
  );
};

// Error logging with context
export const logError = (error: Error, context?: any) => {
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    },
    `Error occurred: ${error.message}`
  );
};
