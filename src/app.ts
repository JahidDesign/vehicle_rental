import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import usersRoutes from './modules/users/users.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Vehicle Rental API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/bookings', bookingsRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
