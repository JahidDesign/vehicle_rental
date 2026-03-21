import { query } from '../../config/database';
import { Vehicle, VehicleType, VehicleStatus } from '../../types';

export interface CreateVehicleDto {
  vehicle_name: string;
  type: VehicleType;
  registration_number: string;
  daily_rent_price: number;
  availability_status?: VehicleStatus;
}

export interface UpdateVehicleDto {
  vehicle_name?: string;
  type?: VehicleType;
  registration_number?: string;
  daily_rent_price?: number;
  availability_status?: VehicleStatus;
}

export const createVehicle = async (dto: CreateVehicleDto) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status = 'available',
  } = dto;

  const existing = await query<Vehicle>(
    'SELECT id FROM vehicles WHERE registration_number = $1',
    [registration_number]
  );
  if (existing.rows.length > 0) {
    throw { status: 400, message: 'Registration number already exists.' };
  }

  const result = await query<Vehicle>(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status]
  );
  return result.rows[0];
};

export const getAllVehicles = async () => {
  const result = await query<Vehicle>(
    'SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles ORDER BY id'
  );
  return result.rows;
};

export const getVehicleById = async (vehicleId: number) => {
  const result = await query<Vehicle>(
    'SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles WHERE id = $1',
    [vehicleId]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Vehicle not found.' };
  }
  return result.rows[0];
};

export const updateVehicle = async (vehicleId: number, dto: UpdateVehicleDto) => {
  await getVehicleById(vehicleId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.vehicle_name !== undefined) { fields.push(`vehicle_name = $${idx++}`); values.push(dto.vehicle_name); }
  if (dto.type !== undefined) { fields.push(`type = $${idx++}`); values.push(dto.type); }
  if (dto.registration_number !== undefined) { fields.push(`registration_number = $${idx++}`); values.push(dto.registration_number); }
  if (dto.daily_rent_price !== undefined) { fields.push(`daily_rent_price = $${idx++}`); values.push(dto.daily_rent_price); }
  if (dto.availability_status !== undefined) { fields.push(`availability_status = $${idx++}`); values.push(dto.availability_status); }

  if (fields.length === 0) {
    throw { status: 400, message: 'No fields provided for update.' };
  }

  fields.push(`updated_at = NOW()`);
  values.push(vehicleId);

  const result = await query<Vehicle>(
    `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
    values
  );
  return result.rows[0];
};

export const deleteVehicle = async (vehicleId: number) => {
  await getVehicleById(vehicleId);

  const activeBookings = await query(
    "SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'",
    [vehicleId]
  );
  if (activeBookings.rows.length > 0) {
    throw { status: 400, message: 'Cannot delete vehicle with active bookings.' };
  }

  await query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
};
