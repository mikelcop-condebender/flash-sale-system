"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const errors_1 = require("../utils/errors");
const defaultValidationOptions = {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
    errors: {
        wrap: {
            label: '"',
        },
    },
};
const validateRequest = (schemas, options = {}) => {
    const validationOptions = { ...defaultValidationOptions, ...options };
    return (req, res, next) => {
        const validationErrors = [];
        // Validate request body
        if (schemas.body) {
            const { error, value } = schemas.body.validate(req.body, validationOptions);
            if (error) {
                validationErrors.push(...error.details.map((detail) => `Body ${detail.message}`));
            }
            else {
                req.body = value;
            }
        }
        // Validate query parameters
        if (schemas.query) {
            const { error, value } = schemas.query.validate(req.query, validationOptions);
            if (error) {
                validationErrors.push(...error.details.map((detail) => `Query ${detail.message}`));
            }
            else {
                req.query = value;
            }
        }
        // Validate URL parameters
        if (schemas.params) {
            const { error, value } = schemas.params.validate(req.params, validationOptions);
            if (error) {
                validationErrors.push(...error.details.map((detail) => `Params ${detail.message}`));
            }
            else {
                req.params = value;
            }
        }
        // Validate headers
        if (schemas.headers) {
            const { error, value } = schemas.headers.validate(req.headers, validationOptions);
            if (error) {
                validationErrors.push(...error.details.map((detail) => `Headers ${detail.message}`));
            }
            else {
                req.headers = value;
            }
        }
        // If validation errors exist, throw ValidationError
        if (validationErrors.length > 0) {
            throw new errors_1.ValidationError(validationErrors.join("; "));
        }
        next();
    };
};
exports.validateRequest = validateRequest;
