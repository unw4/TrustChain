import express from 'express';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { suiClient, executeTransaction, PACKAGE_ID } from '../../services/suiClient';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = express.Router();

// Add sensor reading to part
router.post('/reading', async (req, res, next) => {
  try {
    const {
      partId,
      sensorId,
      readingType,
      value,
      unit,
      isAnomaly,
    } = req.body;

    if (!partId || !sensorId || !readingType || value === undefined || !unit) {
      throw new AppError('Missing required fields', 400);
    }

    const txb = new TransactionBlock();

    // Create sensor reading
    const reading = txb.moveCall({
      target: `${PACKAGE_ID}::sensor_data::new_reading`,
      arguments: [
        txb.pure.string(sensorId),
        txb.pure.u64(Date.now()),
        txb.pure.string(readingType),
        txb.pure.u64(value),
        txb.pure.string(unit),
        txb.pure.bool(isAnomaly || false),
      ],
    });

    // Add to part
    txb.moveCall({
      target: `${PACKAGE_ID}::part::add_sensor_reading`,
      arguments: [
        txb.object(partId),
        reading,
      ],
    });

    const result = await executeTransaction(txb);

    logger.info(`Sensor reading added to part ${partId}: ${sensorId}`);

    // Emit to WebSocket subscribers
    const io = req.app.get('io');
    io.to(`part:${partId}`).emit('sensor:update', {
      partId,
      sensorId,
      readingType,
      value,
      unit,
      isAnomaly: isAnomaly || false,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Get sensor readings for part (from events)
router.get('/part/:partId/readings', async (req, res, next) => {
  try {
    const { partId } = req.params;
    const { limit = 100 } = req.query;

    // Query events for this part
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::part::SensorDataAdded`,
      },
      limit: Number(limit),
      order: 'descending',
    });

    // Filter events for this specific part
    const partEvents = events.data.filter((event: any) => {
      return event.parsedJson?.part_id === partId;
    });

    res.json({
      success: true,
      readings: partEvents.map((event: any) => event.parsedJson),
    });
  } catch (error) {
    next(error);
  }
});

// Simulate sensor data stream
router.post('/simulate/:partId', async (req, res, next) => {
  try {
    const { partId } = req.params;
    const { duration = 60, interval = 5 } = req.body;

    logger.info(`Starting sensor simulation for part ${partId}`);

    // This will be handled by the sensor simulation job
    res.json({
      success: true,
      message: `Simulation started for ${duration} seconds`,
      partId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
