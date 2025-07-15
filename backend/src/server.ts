import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';

// Load environment variables before any config
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/index';
import aiRoutes from './routes/ai.routes';

// Initialize DB connection
connectDB();

// Create express app
const app = express();

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow image uploads, etc.

// ✅ Health check endpoint (for ping services like cron-job.org)
app.get('/ping', (req, res) => {
  res.status(200).send('PONG ✅');
});

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', apiRoutes);

// --- Static frontend (production build) ---
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  // SPA fallback: only for non-API routes
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
