import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

export default router;
