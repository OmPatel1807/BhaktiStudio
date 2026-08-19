import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Essential for Render/Vercel reverse proxies to extract real client IP addresses
app.set('trust proxy', 1);

// Production CORS configuration allowing Vercel deployment frontend & local dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
  'https://bhakti-studio-one.vercel.app',
  'https://bhakti-studio.vercel.app',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        const corsError = new Error('Not allowed by CORS');
        corsError.statusCode = 403;
        callback(corsError);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
