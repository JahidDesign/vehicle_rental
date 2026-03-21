import { Response } from 'express';
import * as vehiclesService from './vehicles.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendError } from '../../utils/response';

export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body;
    const validTypes = ['car', 'bike', 'van', 'SUV'];

    if (!vehicle_name || !type || !registration_number || daily_rent_price === undefined) {
      sendError(res, 400, 'Validation failed.', 'vehicle_name, type, registration_number, and daily_rent_price are required.');
      return;
    }
    if (!validTypes.includes(type)) {
      sendError(res, 400, 'Validation failed.', 'type must be one of: car, bike, van, SUV.');
      return;
    }
    if (daily_rent_price <= 0) {
      sendError(res, 400, 'Validation failed.', 'daily_rent_price must be positive.');
      return;
    }

    const vehicle = await vehiclesService.createVehicle({ vehicle_name, type, registration_number, daily_rent_price, availability_status });
    sendSuccess(res, 201, 'Vehicle created successfully', vehicle);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to create vehicle.', e.message);
  }
};

export const getAllVehicles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await vehiclesService.getAllVehicles();
    const message = vehicles.length > 0 ? 'Vehicles retrieved successfully' : 'No vehicles found';
    sendSuccess(res, 200, message, vehicles);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to retrieve vehicles.', e.message);
  }
};

export const getVehicleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicleId = parseInt(req.params.vehicleId, 10);
    if (isNaN(vehicleId)) { sendError(res, 400, 'Invalid vehicle ID.'); return; }
    const vehicle = await vehiclesService.getVehicleById(vehicleId);
    sendSuccess(res, 200, 'Vehicle retrieved successfully', vehicle);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to retrieve vehicle.', e.message);
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicleId = parseInt(req.params.vehicleId, 10);
    if (isNaN(vehicleId)) { sendError(res, 400, 'Invalid vehicle ID.'); return; }
    const vehicle = await vehiclesService.updateVehicle(vehicleId, req.body);
    sendSuccess(res, 200, 'Vehicle updated successfully', vehicle);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to update vehicle.', e.message);
  }
};

export const deleteVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicleId = parseInt(req.params.vehicleId, 10);
    if (isNaN(vehicleId)) { sendError(res, 400, 'Invalid vehicle ID.'); return; }
    await vehiclesService.deleteVehicle(vehicleId);
    sendSuccess(res, 200, 'Vehicle deleted successfully');
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to delete vehicle.', e.message);
  }
};
