import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone) {
      sendError(res, 400, 'Validation failed.', 'name, email, password, and phone are required.');
      return;
    }
    if (password.length < 6) {
      sendError(res, 400, 'Validation failed.', 'Password must be at least 6 characters.');
      return;
    }

    const user = await authService.registerUser({ name, email, password, phone, role });
    sendSuccess(res, 201, 'User registered successfully', user);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Registration failed.', e.message);
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      sendError(res, 400, 'Validation failed.', 'Email and password are required.');
      return;
    }
    const data = await authService.loginUser({ email, password });
    sendSuccess(res, 200, 'Login successful', data);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Login failed.', e.message);
  }
};
