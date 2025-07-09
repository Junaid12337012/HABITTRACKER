
import express from 'express';
import { getData, saveData } from '../controllers/data.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/').get(protect, getData).post(protect, saveData);

export default router;
