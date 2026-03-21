import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database';
import { config } from '../../config/env';
import { User, UserRole } from '../../types';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export const registerUser = async (dto: RegisterDto) => {
  const { name, email, password, phone, role = 'customer' } = dto;

  const existing = await query<User>(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (existing.rows.length > 0) {
    throw { status: 400, message: 'Email already registered.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await query<User>(
    `INSERT INTO users (name, email, password, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role`,
    [name, email.toLowerCase(), hashedPassword, phone, role]
  );
  return result.rows[0];
};

export const loginUser = async (dto: LoginDto) => {
  const { email, password } = dto;

  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (result.rows.length === 0) {
    throw { status: 401, message: 'Invalid email or password.' };
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 401, message: 'Invalid email or password.' };
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};
