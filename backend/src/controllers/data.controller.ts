

import { Request, Response } from 'express';
import User from '../models/User.model';

// @desc    Get user data
// @route   GET /api/data
// @access  Private
export const getData = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?._id).select('-password');
        if (user) {
            res.json({ lifeData: user.lifeData });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save user data
// @route   POST /api/data
// @access  Private
export const saveData = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?._id);

        if (user) {
            user.lifeData = req.body.lifeData || user.lifeData;
            await user.save();
            res.status(200).json({ message: 'Data saved successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};