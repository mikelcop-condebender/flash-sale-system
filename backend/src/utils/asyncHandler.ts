import { Request, Response, NextFunction } from "express";

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = fn(req, res, next);

    // If the function returns a promise, catch any errors and pass to error handler
    if (result && typeof result.catch === "function") {
      result.catch(next);
    }

    return result;
  };
};
