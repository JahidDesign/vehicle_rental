import { Request } from 'express';

export type UserRole = 'admin' | 'customer';
export type VehicleType = 'car' | 'bike' | 'van' | 'SUV';
export type VehicleStatus = 'available' | 'booked';
export type BookingStatus = 'active' | 'cancelled' | 'returned';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface Vehicle {
  id: number;
  vehicle_name: string;
  type: VehicleType;
  registration_number: string;
  daily_rent_price: number;
  availability_status: VehicleStatus;
}

export interface Booking {
  id: number;
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
  total_price: number;
  status: BookingStatus;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
