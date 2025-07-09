
import { Router } from 'express';
import { protect } from '../middleware/auth';
import crudRouter from '../utils/crudRouter';
import importController from '../controllers/importController';
import { getRoutine, saveRoutine } from '../controllers/routineController';

import Task from '../models/Task';
import Expense from '../models/Expense';
import Income from '../models/Income';
import MoodLog from '../models/MoodLog';
import Habit from '../models/Habit';
import JournalEntry from '../models/JournalEntry';
import PhotoLog from '../models/PhotoLog';
import Goal from '../models/Goal';
import TimeLog from '../models/TimeLog';
import Credential from '../models/Credential';

const router = Router();

// All data routes are protected
router.use(protect);

// Auto-generated CRUD routes
router.use('/tasks', crudRouter(Task));
router.use('/expenses', crudRouter(Expense));
router.use('/income', crudRouter(Income));
router.use('/mood-logs', crudRouter(MoodLog));
router.use('/habits', crudRouter(Habit));
router.use('/journal-entries', crudRouter(JournalEntry));
router.use('/photo-logs', crudRouter(PhotoLog));
router.use('/goals', crudRouter(Goal));
router.use('/time-logs', crudRouter(TimeLog));
router.use('/credentials', crudRouter(Credential));

// Special singleton routes
router.route('/routine').get(getRoutine).post(saveRoutine);

// Special import route
router.post('/import', importController);

export default router;
