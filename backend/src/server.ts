import dotenv from 'dotenv';
import path from 'path';
// Load environment variables before other imports
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/index';
import aiRoutes from './routes/ai.routes';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Initialise DB
connectDB();

// Create express app
const app = express();

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow image uploads, etc.

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', apiRoutes);

// --- Static frontend (production build) ---
import fs from 'fs';
// When you build the Vite frontend, its output should be in ../frontend/dist
// We serve that folder in prod so the same origin is used for API & client
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    // Fallback to index.html for SPA routes (only if not hitting /api/*)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found.' });
        }
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
} else {
    console.warn('⚠️  Frontend build not found – skipping static file serving.');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
