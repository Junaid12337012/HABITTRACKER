

import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import mongoose from 'mongoose';

// @desc    Check if a user has been set up
// @route   GET /api/auth/status
// @access  Public
export const getStatus = async (req: Request, res: Response) => {
    try {
        const userCount = await User.countDocuments();
        res.json({ isSetup: userCount > 0 });
    } catch (error) {
        res.status(500).json({ message: "Server error while checking status" });
    }
};

// @desc    Set up the first user (the only user)
// @route   POST /api/auth/setup
// @access  Public
export const setupUser = async (req: Request, res: Response) => {
    const { password } = req.body;

    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return res.status(400).json({ message: 'Application has already been set up' });
        }

        const user = await User.create({ password });

        if (user) {
            res.status(201).json({
                _id: user._id,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during setup' });
    }
};

// @desc    Log in the user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
    const { password } = req.body;

    try {
        const user = await User.findOne();

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
};


// @desc    Delete the user and all their data
// @route   DELETE /api/auth/delete-account
// @access  Private
// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if(!req.body || !currentPassword || !newPassword){
        return res.status(400).json({ message: 'Please provide current and new password.' });
    }

    try {
        const user = await User.findOne();
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        if(!(await user.matchPassword(currentPassword))){
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error while changing password' });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        // This is a highly destructive operation.
        // It will delete all collections from the database.
        const db = mongoose.connection.db;
        if(!db){
            return res.status(500).json({ message: 'Database not initialised.' });
        }
        const collections = await db.collections();

        for (const collection of collections) {
            await collection.deleteMany({});
        }

        res.status(200).json({ message: 'Account and all data deleted successfully.' });

    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: 'Server error during account deletion.' });
    }
};