
import express from 'express';
import { setupUser, loginUser, changePassword } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/setup', setupUser);
router.post('/login', loginUser);
router.post('/change-password', protect, changePassword);

export default router;