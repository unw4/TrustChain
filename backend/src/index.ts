import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import aircraftRoutes from './api/routes/aircraft';
import partRoutes from './api/routes/part';
import sensorRoutes from './api/routes/sensor';
import { initializeSensorJobs } from './jobs/sensorSimulation';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.use('/api/aircraft', aircraftRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/sensors', sensorRoutes);

// Error handling
app.use(errorHandler);

// WebSocket connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe:part', (partId: string) => {
    socket.join(`part:${partId}`);
    logger.info(`Client ${socket.id} subscribed to part ${partId}`);
  });

  socket.on('subscribe:aircraft', (aircraftId: string) => {
    socket.join(`aircraft:${aircraftId}`);
    logger.info(`Client ${socket.id} subscribed to aircraft ${aircraftId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available globally
app.set('io', io);

// Initialize sensor simulation jobs
initializeSensorJobs(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`WebSocket server ready`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };
