import { Request, Response, NextFunction } from "express";
import { Schema, ValidationOptions } from "joi";
import { ValidationError } from "../utils/errors";

type ValidationSchemas = {
  body?: Schema;
  query?: Schema;
  params?: Schema;
  headers?: Schema;
};

const defaultValidationOptions: ValidationOptions = {
  abortEarly: false,
  stripUnknown: true,
  allowUnknown: false,
  errors: {
    wrap: {
      label: '"',
    },
  },
};

export const validateRequest = (
  schemas: ValidationSchemas,
  options: ValidationOptions = {}
) => {
  const validationOptions = { ...defaultValidationOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    // Validate request body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(
        req.body,
        validationOptions
      );
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Body ${detail.message}`)
        );
      } else {
        req.body = value;
      }
    }

    // Validate query parameters
    if (schemas.query) {
      const { error, value } = schemas.query.validate(
        req.query,
        validationOptions
      );
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Query ${detail.message}`)
        );
      } else {
        req.query = value;
      }
    }

    // Validate URL parameters
    if (schemas.params) {
      const { error, value } = schemas.params.validate(
        req.params,
        validationOptions
      );
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Params ${detail.message}`)
        );
      } else {
        req.params = value;
      }
    }

    // Validate headers
    if (schemas.headers) {
      const { error, value } = schemas.headers.validate(
        req.headers,
        validationOptions
      );
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Headers ${detail.message}`)
        );
      } else {
        req.headers = value;
      }
    }

    // If validation errors exist, throw ValidationError
    if (validationErrors.length > 0) {
      throw new ValidationError(validationErrors.join("; "));
    }

    next();
  };
};
