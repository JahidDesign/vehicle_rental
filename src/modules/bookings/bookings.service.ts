import { pool, query } from '../../config/database';
import { Booking, BookingStatus } from '../../types';

export interface CreateBookingDto {
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
}

interface BookingWithDetails extends Booking {
  customer?: { name: string; email: string };
  vehicle?: {
    vehicle_name: string;
    registration_number: string;
    type?: string;
    daily_rent_price?: number;
    availability_status?: string;
  };
}

const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const createBooking = async (dto: CreateBookingDto, requestingUserId: number, requestingRole: string) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = dto;

  // Customers can only book for themselves
  if (requestingRole === 'customer' && requestingUserId !== customer_id) {
    throw { status: 403, message: 'Customers can only create bookings for themselves.' };
  }

  // Validate dates
  const start = new Date(rent_start_date);
  const end = new Date(rent_end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw { status: 400, message: 'Invalid date format.' };
  }
  if (end <= start) {
    throw { status: 400, message: 'rent_end_date must be after rent_start_date.' };
  }

  // Check customer exists
  const customerCheck = await query('SELECT id FROM users WHERE id = $1', [customer_id]);
  if (customerCheck.rows.length === 0) {
    throw { status: 404, message: 'Customer not found.' };
  }

  // Check vehicle availability
  interface VehicleRow { id: number; daily_rent_price: string; availability_status: string; vehicle_name: string; }
  const vehicleResult = await query<VehicleRow>(
    'SELECT id, daily_rent_price, availability_status, vehicle_name FROM vehicles WHERE id = $1',
    [vehicle_id]
  );
  if (vehicleResult.rows.length === 0) {
    throw { status: 404, message: 'Vehicle not found.' };
  }

  const vehicle = vehicleResult.rows[0];
  if (vehicle.availability_status !== 'available') {
    throw { status: 400, message: 'Vehicle is not available for booking.' };
  }

  const days = calculateDays(rent_start_date, rent_end_date);
  const total_price = parseFloat(vehicle.daily_rent_price) * days;

  // Transactionally create booking and update vehicle
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query<Booking>(
      `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
    );

    await client.query(
      "UPDATE vehicles SET availability_status = 'booked', updated_at = NOW() WHERE id = $1",
      [vehicle_id]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];
    return {
      ...booking,
      vehicle: {
        vehicle_name: vehicle.vehicle_name,
        daily_rent_price: parseFloat(vehicle.daily_rent_price),
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getAllBookings = async (userId: number, role: string) => {
  if (role === 'admin') {
    const result = await query<BookingWithDetails>(`
      SELECT
        b.id, b.customer_id, b.vehicle_id,
        b.rent_start_date, b.rent_end_date,
        b.total_price, b.status,
        json_build_object('name', u.name, 'email', u.email) AS customer,
        json_build_object(
          'vehicle_name', v.vehicle_name,
          'registration_number', v.registration_number
        ) AS vehicle
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.id
    `);
    return result.rows;
  } else {
    const result = await query<BookingWithDetails>(`
      SELECT
        b.id, b.vehicle_id,
        b.rent_start_date, b.rent_end_date,
        b.total_price, b.status,
        json_build_object(
          'vehicle_name', v.vehicle_name,
          'registration_number', v.registration_number,
          'type', v.type
        ) AS vehicle
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.customer_id = $1
      ORDER BY b.id
    `, [userId]);
    return result.rows;
  }
};

export const updateBooking = async (
  bookingId: number,
  newStatus: BookingStatus,
  requestingUserId: number,
  requestingRole: string
) => {
  const bookingResult = await query<Booking>(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );
  if (bookingResult.rows.length === 0) {
    throw { status: 404, message: 'Booking not found.' };
  }

  const booking = bookingResult.rows[0];

  if (booking.status !== 'active') {
    throw { status: 400, message: `Cannot update a booking with status '${booking.status}'.` };
  }

  // Role-based status update rules
  if (requestingRole === 'customer') {
    if (requestingUserId !== booking.customer_id) {
      throw { status: 403, message: 'Forbidden. You can only update your own bookings.' };
    }
    if (newStatus !== 'cancelled') {
      throw { status: 403, message: 'Customers can only cancel their bookings.' };
    }
    // Customers can only cancel before start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.rent_start_date);
    if (startDate <= today) {
      throw { status: 400, message: 'Cannot cancel booking after or on the start date.' };
    }
  }

  if (requestingRole === 'admin' && newStatus !== 'returned' && newStatus !== 'cancelled') {
    throw { status: 400, message: 'Admins can only mark bookings as returned or cancelled.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatedBooking = await client.query<Booking>(
      "UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [newStatus, bookingId]
    );

    // Free up vehicle if cancelled or returned
    if (newStatus === 'cancelled' || newStatus === 'returned') {
      await client.query(
        "UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1",
        [booking.vehicle_id]
      );
    }

    await client.query('COMMIT');

    const result = updatedBooking.rows[0];

    if (newStatus === 'returned') {
      return {
        ...result,
        vehicle: { availability_status: 'available' },
      };
    }
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Auto-return bookings whose rent_end_date has passed
export const autoReturnExpiredBookings = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expiredResult = await client.query<Booking>(
      "SELECT * FROM bookings WHERE status = 'active' AND rent_end_date < CURRENT_DATE"
    );

    if (expiredResult.rows.length === 0) {
      await client.query('COMMIT');
      return 0;
    }

    const vehicleIds = expiredResult.rows.map((b) => b.vehicle_id);
    const bookingIds = expiredResult.rows.map((b) => b.id);

    await client.query(
      "UPDATE bookings SET status = 'returned', updated_at = NOW() WHERE id = ANY($1)",
      [bookingIds]
    );

    await client.query(
      "UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = ANY($1)",
      [vehicleIds]
    );

    await client.query('COMMIT');
    return expiredResult.rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
