"use strict";
// src/utils/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePrismaError = exports.formatErrorResponse = exports.isOperationalError = exports.HTTP_STATUS = exports.ERROR_CODES = exports.PurchaseProcessingError = exports.DuplicatePurchaseError = exports.SoldOutError = exports.SaleExpiredError = exports.SaleNotActiveError = exports.FlashSaleError = exports.ServiceError = exports.DatabaseError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code, isOperational = true) {
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
exports.AppError = AppError;
/**
 * Validation error for invalid input data
 */
class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
        if (field) {
            this.message = `${field}: ${message}`;
        }
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication error for unauthorized access
 */
class AuthenticationError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "AUTHENTICATION_ERROR");
        this.name = "AuthenticationError";
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization error for forbidden access
 */
class AuthorizationError extends AppError {
    constructor(message = "Insufficient permissions") {
        super(message, 403, "AUTHORIZATION_ERROR");
        this.name = "AuthorizationError";
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Resource not found error
 */
class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error for duplicate resources or business rule violations
 */
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, "CONFLICT_ERROR");
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
/**
 * Rate limit exceeded error
 */
class RateLimitError extends AppError {
    constructor(message = "Rate limit exceeded") {
        super(message, 429, "RATE_LIMIT_EXCEEDED");
        this.name = "RateLimitError";
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Database operation error
 */
class DatabaseError extends AppError {
    constructor(message, originalError) {
        super(`Database error: ${message}`, 500, "DATABASE_ERROR");
        this.name = "DatabaseError";
        if (originalError && originalError.stack) {
            this.stack = originalError.stack;
        }
    }
}
exports.DatabaseError = DatabaseError;
/**
 * External service error
 */
class ServiceError extends AppError {
    constructor(service, message, statusCode = 503) {
        super(`${service} service error: ${message}`, statusCode, "SERVICE_ERROR");
        this.name = "ServiceError";
        this.service = service;
    }
}
exports.ServiceError = ServiceError;
/**
 * Flash sale specific errors
 */
class FlashSaleError extends AppError {
    constructor(message, code) {
        super(message, 400, code || "FLASH_SALE_ERROR");
        this.name = "FlashSaleError";
    }
}
exports.FlashSaleError = FlashSaleError;
class SaleNotActiveError extends FlashSaleError {
    constructor() {
        super("Flash sale is not currently active", "SALE_NOT_ACTIVE");
        this.name = "SaleNotActiveError";
    }
}
exports.SaleNotActiveError = SaleNotActiveError;
class SaleExpiredError extends FlashSaleError {
    constructor() {
        super("Flash sale has expired", "SALE_EXPIRED");
        this.name = "SaleExpiredError";
    }
}
exports.SaleExpiredError = SaleExpiredError;
class SoldOutError extends FlashSaleError {
    constructor() {
        super("Product is sold out", "SOLD_OUT");
        this.name = "SoldOutError";
    }
}
exports.SoldOutError = SoldOutError;
class DuplicatePurchaseError extends FlashSaleError {
    constructor() {
        super("User has already purchased this item", "DUPLICATE_PURCHASE");
        this.statusCode = 409;
        this.name = "DuplicatePurchaseError";
    }
}
exports.DuplicatePurchaseError = DuplicatePurchaseError;
class PurchaseProcessingError extends FlashSaleError {
    constructor(message = "Purchase is already being processed") {
        super(message, "PURCHASE_PROCESSING");
        this.statusCode = 409;
        this.name = "PurchaseProcessingError";
    }
}
exports.PurchaseProcessingError = PurchaseProcessingError;
/**
 * Error code constants for consistent error handling
 */
exports.ERROR_CODES = {
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
};
/**
 * HTTP status code constants
 */
exports.HTTP_STATUS = {
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
};
/**
 * Utility function to check if an error is operational (expected) vs programming error
 */
const isOperationalError = (error) => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};
exports.isOperationalError = isOperationalError;
/**
 * Utility function to format error for API response
 */
const formatErrorResponse = (error) => {
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
exports.formatErrorResponse = formatErrorResponse;
/**
 * Utility function to create error from Prisma database errors
 */
const handlePrismaError = (error) => {
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
            return new DatabaseError(error.message || "Database operation failed", error);
    }
};
exports.handlePrismaError = handlePrismaError;
