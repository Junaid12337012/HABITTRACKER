
import express from 'express';
import { protect } from '../middleware/auth';
import { generateSummary, generateReport, initChat, continueChat } from '../controllers/ai.controller';

const router = express.Router();

router.use(protect);

router.post('/summary', generateSummary);
router.post('/report', generateReport);
router.post('/chat/init', initChat);
router.post('/chat/message', continueChat);

export default router;
