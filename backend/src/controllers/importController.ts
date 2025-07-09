

import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
import Routine from '../models/Routine';

const models = {
    Task, Expense, Income, MoodLog, Habit, JournalEntry, PhotoLog, Goal, TimeLog, Credential, Routine
};

const importController = async (req: Request, res: Response) => {
    const dataToImport = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Clear all existing data
        for (const model of Object.values(models)) {
            await (model as any).deleteMany({}, { session });
        }

        // 2. Import new data
        if (dataToImport.dailyData) {
            const dailyItems = Object.values(dataToImport.dailyData).flat() as any[];
            for (const day of dailyItems) {
                if (day.tasks && day.tasks.length > 0) await Task.insertMany(day.tasks, { session });
                if (day.expenses && day.expenses.length > 0) await Expense.insertMany(day.expenses, { session });
                if (day.income && day.income.length > 0) await Income.insertMany(day.income, { session });
                if (day.timeLogs && day.timeLogs.length > 0) await TimeLog.insertMany(day.timeLogs, { session });
                if (day.moodLog) await MoodLog.create([day.moodLog], { session });
                if (day.journalEntry) await JournalEntry.create([day.journalEntry], { session });
                if (day.photoLog) await PhotoLog.create([day.photoLog], { session });
            }
        }
        
        if (dataToImport.habits && dataToImport.habits.length > 0) {
            await Habit.insertMany(dataToImport.habits, { session });
        }
        if (dataToImport.goals && dataToImport.goals.length > 0) {
            await Goal.insertMany(dataToImport.goals, { session });
        }
        if (dataToImport.credentials && dataToImport.credentials.length > 0) {
            await Credential.insertMany(dataToImport.credentials, { session });
        }
        if (dataToImport.weeklyRoutine) {
            await Routine.create([{ weeklyRoutine: dataToImport.weeklyRoutine }], { session });
        }
        
        await session.commitTransaction();
        res.status(200).json({ message: 'Data imported successfully' });

    } catch (error) {
        await session.abortTransaction();
        console.error('Import failed:', error);
        res.status(500).json({ message: 'Failed to import data' });
    } finally {
        session.endSession();
    }
};

export default importController;