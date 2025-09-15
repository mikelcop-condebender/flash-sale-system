"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        const result = fn(req, res, next);
        // If the function returns a promise, catch any errors and pass to error handler
        if (result && typeof result.catch === "function") {
            result.catch(next);
        }
        return result;
    };
};
exports.asyncHandler = asyncHandler;
