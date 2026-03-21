import { Response } from 'express';
import * as usersService from './users.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendError } from '../../utils/response';

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await usersService.getAllUsers();
    sendSuccess(res, 200, 'Users retrieved successfully', users);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to retrieve users.', e.message);
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) { sendError(res, 400, 'Invalid user ID.'); return; }

    // Customers can only update their own profile
    if (req.user?.role === 'customer' && req.user.id !== userId) {
      sendError(res, 403, 'Forbidden. You can only update your own profile.');
      return;
    }

    // Only admins can change roles
    if (req.user?.role === 'customer' && req.body.role) {
      delete req.body.role;
    }

    const user = await usersService.updateUser(userId, req.body);
    sendSuccess(res, 200, 'User updated successfully', user);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to update user.', e.message);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) { sendError(res, 400, 'Invalid user ID.'); return; }
    await usersService.deleteUser(userId);
    sendSuccess(res, 200, 'User deleted successfully');
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to delete user.', e.message);
  }
};
