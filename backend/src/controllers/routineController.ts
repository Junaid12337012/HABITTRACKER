

import { Request, Response } from 'express';
import Routine from '../models/Routine';

// @desc    Get the weekly routine
// @route   GET /api/routine
// @access  Private
export const getRoutine = async (req: Request, res: Response) => {
    try {
        const routine = await Routine.findOne();
        if (routine) {
            res.json(routine.toJSON());
        } else {
            // If no routine exists, send a default structure
            const initialRoutine = Object.fromEntries(
              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => [day, []])
            );
            res.json({ weeklyRoutine: initialRoutine });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create or update the weekly routine
// @route   POST /api/routine
// @access  Private
export const saveRoutine = async (req: Request, res: Response) => {
    const { weeklyRoutine } = req.body;
    try {
        let routine = await Routine.findOne();
        if (routine) {
            routine.weeklyRoutine = weeklyRoutine;
        } else {
            routine = new Routine({ weeklyRoutine });
        }
        const savedRoutine = await routine.save();
        res.status(200).json(savedRoutine.toJSON());
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};