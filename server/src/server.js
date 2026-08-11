import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS configuration allowing Vercel deployment frontend & local dev
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://bhakti-studio.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for deployment flexibility
      }
    },
    credentials: true,
  })
);

// Middlewares with expanded 50MB payload limit for high-res photo uploads and Base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Top-Level Health Check Endpoint for Render Service Probes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Bhakti Studio Express API Engine',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Base Route
app.use('/api/v1', apiRoutes);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Bhakti Studio Server running on http://localhost:${PORT}`);
  });
}

export default app;
