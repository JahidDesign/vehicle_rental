import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown
) => {
  const payload: Record<string, unknown> = { success: true, message };
  if (data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown
) => {
  const payload: Record<string, unknown> = { success: false, message };
  if (errors !== undefined) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
