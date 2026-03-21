import { Response } from 'express';
import * as bookingsService from './bookings.service';
import { AuthRequest, BookingStatus } from '../../types';
import { sendSuccess, sendError } from '../../utils/response';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = req.body;

    if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
      sendError(res, 400, 'Validation failed.', 'customer_id, vehicle_id, rent_start_date, and rent_end_date are required.');
      return;
    }

    const booking = await bookingsService.createBooking(
      { customer_id, vehicle_id, rent_start_date, rent_end_date },
      req.user!.id,
      req.user!.role
    );
    sendSuccess(res, 201, 'Booking created successfully', booking);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to create booking.', e.message);
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookings = await bookingsService.getAllBookings(req.user!.id, req.user!.role);
    const message = req.user!.role === 'admin'
      ? 'Bookings retrieved successfully'
      : 'Your bookings retrieved successfully';
    sendSuccess(res, 200, message, bookings);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to retrieve bookings.', e.message);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (isNaN(bookingId)) { sendError(res, 400, 'Invalid booking ID.'); return; }

    const { status } = req.body;
    const validStatuses: BookingStatus[] = ['cancelled', 'returned'];
    if (!status || !validStatuses.includes(status)) {
      sendError(res, 400, 'Validation failed.', 'status must be "cancelled" or "returned".');
      return;
    }

    const booking = await bookingsService.updateBooking(
      bookingId,
      status as BookingStatus,
      req.user!.id,
      req.user!.role
    );

    const message = status === 'cancelled'
      ? 'Booking cancelled successfully'
      : 'Booking marked as returned. Vehicle is now available';

    sendSuccess(res, 200, message, booking);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    sendError(res, e.status || 500, e.message || 'Failed to update booking.', e.message);
  }
};
