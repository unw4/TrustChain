import express from 'express';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { suiClient, executeTransaction, getKeypair, PACKAGE_ID } from '../../services/suiClient';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = express.Router();

// Create new aircraft
router.post('/create', async (req, res, next) => {
  try {
    const { tailNumber, model, manufacturer, manufactureDate } = req.body;

    if (!tailNumber || !model || !manufacturer || !manufactureDate) {
      throw new AppError('Missing required fields', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::aircraft::create_aircraft`,
      arguments: [
        txb.pure.string(tailNumber),
        txb.pure.string(model),
        txb.pure.string(manufacturer),
        txb.pure.u64(manufactureDate),
      ],
    });

    const result = await executeTransaction(txb);

    // Extract created aircraft object
    const createdObject = result.objectChanges?.find(
      (change: any) => change.type === 'created' && change.objectType.includes('::aircraft::Aircraft')
    );

    if (!createdObject) {
      throw new AppError('Failed to create aircraft', 500);
    }

    logger.info(`Aircraft created: ${createdObject.objectId}`);

    res.json({
      success: true,
      aircraftId: createdObject.objectId,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Get aircraft details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const aircraft = await suiClient.getObject({
      id,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });

    if (!aircraft.data) {
      throw new AppError('Aircraft not found', 404);
    }

    res.json({
      success: true,
      aircraft: aircraft.data,
    });
  } catch (error) {
    next(error);
  }
});

// Complete flight
router.post('/:id/complete-flight', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flightHours } = req.body;

    if (!flightHours) {
      throw new AppError('Flight hours required', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::aircraft::complete_flight`,
      arguments: [
        txb.object(id),
        txb.pure.u64(flightHours),
        txb.pure.u64(Date.now()),
      ],
    });

    const result = await executeTransaction(txb);

    logger.info(`Flight completed for aircraft ${id}: ${flightHours} hours`);

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Change aircraft status
router.post('/:id/change-status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('Status required', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::aircraft::change_status`,
      arguments: [
        txb.object(id),
        txb.pure.string(status),
        txb.pure.u64(Date.now()),
      ],
    });

    const result = await executeTransaction(txb);

    logger.info(`Aircraft ${id} status changed to ${status}`);

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// List all aircraft for owner
router.get('/owner/:address', async (req, res, next) => {
  try {
    const { address } = req.params;

    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::aircraft::Aircraft`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    res.json({
      success: true,
      aircraft: objects.data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
