import { Router } from 'express';
import * as vehiclesController from './vehicles.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', vehiclesController.getAllVehicles);
router.get('/:vehicleId', vehiclesController.getVehicleById);
router.post('/', authenticate, authorize('admin'), vehiclesController.createVehicle);
router.put('/:vehicleId', authenticate, authorize('admin'), vehiclesController.updateVehicle);
router.delete('/:vehicleId', authenticate, authorize('admin'), vehiclesController.deleteVehicle);

export default router;
