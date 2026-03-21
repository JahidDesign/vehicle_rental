import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { User, UserRole } from '../../types';

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  password?: string;
}

export const getAllUsers = async () => {
  const result = await query<User>(
    'SELECT id, name, email, phone, role FROM users ORDER BY id'
  );
  return result.rows;
};

export const getUserById = async (userId: number) => {
  const result = await query<User>(
    'SELECT id, name, email, phone, role FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'User not found.' };
  }
  return result.rows[0];
};

export const updateUser = async (userId: number, dto: UpdateUserDto) => {
  await getUserById(userId);

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.name !== undefined) { fields.push(`name = $${idx++}`); values.push(dto.name); }
  if (dto.email !== undefined) { fields.push(`email = $${idx++}`); values.push(dto.email.toLowerCase()); }
  if (dto.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(dto.phone); }
  if (dto.role !== undefined) { fields.push(`role = $${idx++}`); values.push(dto.role); }
  if (dto.password !== undefined) {
    const hashed = await bcrypt.hash(dto.password, 10);
    fields.push(`password = $${idx++}`);
    values.push(hashed);
  }

  if (fields.length === 0) {
    throw { status: 400, message: 'No fields provided for update.' };
  }

  fields.push('updated_at = NOW()');
  values.push(userId);

  const result = await query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role`,
    values
  );
  return result.rows[0];
};

export const deleteUser = async (userId: number) => {
  await getUserById(userId);

  const activeBookings = await query(
    "SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active'",
    [userId]
  );
  if (activeBookings.rows.length > 0) {
    throw { status: 400, message: 'Cannot delete user with active bookings.' };
  }

  await query('DELETE FROM users WHERE id = $1', [userId]);
};
