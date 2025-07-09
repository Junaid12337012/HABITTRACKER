
import express from 'express';
import { getStatus, setupUser, loginUser, deleteAccount } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/status', getStatus);
router.post('/setup', setupUser);
router.post('/login', loginUser);
router.delete('/delete-account', protect, deleteAccount);


export default router;
