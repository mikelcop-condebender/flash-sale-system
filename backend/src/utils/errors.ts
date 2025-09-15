// src/utils/errors.ts

/**
 * Base application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.name = this.constructor.name;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";

    if (field) {
      this.message = `${field}: ${message}`;
    }
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization error for forbidden access
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Conflict error for duplicate resources or business rule violations
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`Database error: ${message}`, 500, "DATABASE_ERROR");
    this.name = "DatabaseError";

    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * External service error
 */
export class ServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, statusCode: number = 503) {
    super(`${service} service error: ${message}`, statusCode, "SERVICE_ERROR");
    this.name = "ServiceError";
    this.service = service;
  }
}

/**
 * Flash sale specific errors
 */
export class FlashSaleError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || "FLASH_SALE_ERROR");
    this.name = "FlashSaleError";
  }
}

export class SaleNotActiveError extends FlashSaleError {
  constructor() {
    super("Flash sale is not currently active", "SALE_NOT_ACTIVE");
    this.name = "SaleNotActiveError";
  }
}

export class SaleExpiredError extends FlashSaleError {
  constructor() {
    super("Flash sale has expired", "SALE_EXPIRED");
    this.name = "SaleExpiredError";
  }
}

export class SoldOutError extends FlashSaleError {
  constructor() {
    super("Product is sold out", "SOLD_OUT");
    this.name = "SoldOutError";
  }
}

export class DuplicatePurchaseError extends FlashSaleError {
  constructor() {
    super("User has already purchased this item", "DUPLICATE_PURCHASE");
    this.statusCode = 409;
    this.name = "DuplicatePurchaseError";
  }
}

export class PurchaseProcessingError extends FlashSaleError {
  constructor(message: string = "Purchase is already being processed") {
    super(message, "PURCHASE_PROCESSING");
    this.statusCode = 409;
    this.name = "PurchaseProcessingError";
  }
}

/**
 * Error code constants for consistent error handling
 */
export const ERROR_CODES = {
  // Generic errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  DATABASE_ERROR: "DATABASE_ERROR",
  SERVICE_ERROR: "SERVICE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // Flash sale specific errors
  FLASH_SALE_ERROR: "FLASH_SALE_ERROR",
  SALE_NOT_ACTIVE: "SALE_NOT_ACTIVE",
  SALE_EXPIRED: "SALE_EXPIRED",
  SOLD_OUT: "SOLD_OUT",
  DUPLICATE_PURCHASE: "DUPLICATE_PURCHASE",
  PURCHASE_PROCESSING: "PURCHASE_PROCESSING",
  INVALID_FLASH_SALE_ID: "INVALID_FLASH_SALE_ID",
  PURCHASE_FAILED: "PURCHASE_FAILED",
} as const;

/**
 * HTTP status code constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Utility function to check if an error is operational (expected) vs programming error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Utility function to format error for API response
 */
export const formatErrorResponse = (error: AppError) => {
  return {
    success: false,
    error: {
      code: error.code || "UNKNOWN_ERROR",
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp.toISOString(),
    },
  };
};

/**
 * Utility function to create error from Prisma database errors
 */
export const handlePrismaError = (error: any): AppError => {
  switch (error.code) {
    case "P2002":
      return new ConflictError("A record with this data already exists");
    case "P2025":
      return new NotFoundError("Record");
    case "P2003":
      return new ValidationError("Foreign key constraint failed");
    case "P2016":
      return new ValidationError("Query interpretation error");
    default:
      return new DatabaseError(
        error.message || "Database operation failed",
        error
      );
  }
};
