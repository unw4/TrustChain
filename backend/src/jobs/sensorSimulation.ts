import { Queue, Worker } from 'bullmq';
import { Server } from 'socket.io';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { executeTransaction, PACKAGE_ID } from '../services/suiClient';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const sensorQueue = new Queue('sensor-simulation', { connection });

interface SensorJobData {
  partId: string;
  sensorType: 'temperature' | 'vibration' | 'pressure';
  baseValue: number;
  variance: number;
  anomalyChance: number;
}

// Initialize sensor simulation jobs
export function initializeSensorJobs(io: Server) {
  const worker = new Worker(
    'sensor-simulation',
    async (job) => {
      const { partId, sensorType, baseValue, variance, anomalyChance } = job.data as SensorJobData;

      try {
        // Generate sensor reading
        const value = generateSensorValue(baseValue, variance);
        const isAnomaly = Math.random() < anomalyChance;
        const anomalyValue = isAnomaly ? value * 1.5 : value;

        const sensorId = `${sensorType}-sensor-${partId.slice(0, 8)}`;
        const unit = getUnit(sensorType);

        // Create transaction
        const txb = new TransactionBlock();

        const reading = txb.moveCall({
          target: `${PACKAGE_ID}::sensor_data::new_reading`,
          arguments: [
            txb.pure.string(sensorId),
            txb.pure.u64(Date.now()),
            txb.pure.string(sensorType),
            txb.pure.u64(Math.floor(anomalyValue)),
            txb.pure.string(unit),
            txb.pure.bool(isAnomaly),
          ],
        });

        txb.moveCall({
          target: `${PACKAGE_ID}::part::add_sensor_reading`,
          arguments: [
            txb.object(partId),
            reading,
          ],
        });

        await executeTransaction(txb);

        // Emit to WebSocket
        io.to(`part:${partId}`).emit('sensor:update', {
          partId,
          sensorId,
          readingType: sensorType,
          value: Math.floor(anomalyValue),
          unit,
          isAnomaly,
          timestamp: Date.now(),
        });

        if (isAnomaly) {
          logger.warn(`Anomaly detected for part ${partId}: ${sensorType} = ${anomalyValue} ${unit}`);
          io.to(`part:${partId}`).emit('sensor:anomaly', {
            partId,
            sensorType,
            value: Math.floor(anomalyValue),
            unit,
            timestamp: Date.now(),
          });
        }

        logger.info(`Sensor data recorded for part ${partId}: ${sensorType} = ${Math.floor(anomalyValue)} ${unit}`);
      } catch (error) {
        logger.error(`Sensor simulation failed for part ${partId}:`, error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Sensor job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Sensor job ${job?.id} failed:`, err);
  });

  logger.info('Sensor simulation worker initialized');
}

// Add sensor simulation job
export async function addSensorSimulation(
  partId: string,
  sensorType: 'temperature' | 'vibration' | 'pressure',
  intervalSeconds: number = 10
) {
  const baseValues = {
    temperature: 7500, // 75.00°C
    vibration: 250,    // 2.50 Hz
    pressure: 3500,    // 35.00 PSI
  };

  await sensorQueue.add(
    `sensor-${partId}-${sensorType}`,
    {
      partId,
      sensorType,
      baseValue: baseValues[sensorType],
      variance: baseValues[sensorType] * 0.1, // 10% variance
      anomalyChance: 0.05, // 5% chance of anomaly
    },
    {
      repeat: {
        every: intervalSeconds * 1000,
      },
      jobId: `${partId}-${sensorType}`,
    }
  );

  logger.info(`Sensor simulation scheduled for part ${partId}: ${sensorType} every ${intervalSeconds}s`);
}

// Remove sensor simulation
export async function removeSensorSimulation(partId: string, sensorType: string) {
  await sensorQueue.remove(`${partId}-${sensorType}`);
  logger.info(`Sensor simulation removed for part ${partId}: ${sensorType}`);
}

// Helper functions
function generateSensorValue(base: number, variance: number): number {
  return base + (Math.random() * variance * 2 - variance);
}

function getUnit(sensorType: string): string {
  const units: Record<string, string> = {
    temperature: 'celsius',
    vibration: 'hz',
    pressure: 'psi',
  };
  return units[sensorType] || 'unknown';
}

export { sensorQueue };
