import { Router } from 'express';
import * as bookingsController from './bookings.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, bookingsController.createBooking);
router.get('/', authenticate, bookingsController.getAllBookings);
router.put('/:bookingId', authenticate, bookingsController.updateBooking);

export default router;
