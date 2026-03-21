import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, `Route ${req.originalUrl} not found.`);
};

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled error:', err.message);
  sendError(res, 500, 'Internal server error.', err.message);
};
