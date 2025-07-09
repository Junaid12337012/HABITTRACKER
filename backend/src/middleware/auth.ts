import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Define what a decoded JWT looks like
interface JwtPayload {
    id: string;
}

// Optional: Define what your authenticated user looks like
interface AuthenticatedUser {
    _id: string;
}

// Extend Express Request with a `user` object (recommended for type safety)
declare module 'express-serve-static-core' {
    interface Request {
        user?: AuthenticatedUser;
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

            const user = await User.findById(decoded.id).select('_id');

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Attach minimal user object to req
            (req as any).user = { _id: (user as any)._id.toString() };

            next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};
