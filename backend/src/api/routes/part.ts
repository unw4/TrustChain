import express from 'express';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { suiClient, executeTransaction, PACKAGE_ID } from '../../services/suiClient';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

const router = express.Router();

// Create new part
router.post('/create', async (req, res, next) => {
  try {
    const {
      serialNumber,
      partType,
      manufacturer,
      manufactureDate,
      maintenanceInterval,
    } = req.body;

    if (!serialNumber || !partType || !manufacturer || !manufactureDate || !maintenanceInterval) {
      throw new AppError('Missing required fields', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::part::create_part`,
      arguments: [
        txb.pure.string(serialNumber),
        txb.pure.string(partType),
        txb.pure.string(manufacturer),
        txb.pure.u64(manufactureDate),
        txb.pure.u64(maintenanceInterval),
      ],
    });

    const result = await executeTransaction(txb);

    const createdObject = result.objectChanges?.find(
      (change: any) => change.type === 'created' && change.objectType.includes('::part::Part')
    );

    if (!createdObject) {
      throw new AppError('Failed to create part', 500);
    }

    logger.info(`Part created: ${createdObject.objectId}`);

    res.json({
      success: true,
      partId: createdObject.objectId,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Get part details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const part = await suiClient.getObject({
      id,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });

    if (!part.data) {
      throw new AppError('Part not found', 404);
    }

    res.json({
      success: true,
      part: part.data,
    });
  } catch (error) {
    next(error);
  }
});

// Attach part to parent
router.post('/:id/attach', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parentId, aircraftId } = req.body;

    if (!parentId || !aircraftId) {
      throw new AppError('Parent ID and Aircraft ID required', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::part::attach_to_parent`,
      arguments: [
        txb.object(id),
        txb.pure.address(parentId),
        txb.pure.address(aircraftId),
      ],
    });

    const result = await executeTransaction(txb);

    logger.info(`Part ${id} attached to parent ${parentId}`);

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Update flight hours
router.post('/:id/update-hours', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additionalHours } = req.body;

    if (!additionalHours) {
      throw new AppError('Additional hours required', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::part::update_flight_hours`,
      arguments: [
        txb.object(id),
        txb.pure.u64(additionalHours),
      ],
    });

    const result = await executeTransaction(txb);

    logger.info(`Part ${id} flight hours updated: +${additionalHours}`);

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Perform maintenance
router.post('/:id/maintenance', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { maintenanceType, nextMaintenanceHours } = req.body;

    if (!maintenanceType || !nextMaintenanceHours) {
      throw new AppError('Maintenance type and next maintenance hours required', 400);
    }

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::part::perform_maintenance`,
      arguments: [
        txb.object(id),
        txb.pure.string(maintenanceType),
        txb.pure.u64(Date.now()),
        txb.pure.u64(nextMaintenanceHours),
      ],
    });

    const result = await executeTransaction(txb);

    logger.info(`Maintenance performed on part ${id}: ${maintenanceType}`);

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// Mark part as active
router.post('/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;

    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${PACKAGE_ID}::part::mark_active`,
      arguments: [txb.object(id)],
    });

    const result = await executeTransaction(txb);

    logger.info(`Part ${id} marked as active`);

    res.json({
      success: true,
      digest: result.digest,
    });
  } catch (error) {
    next(error);
  }
});

// List all parts for owner
router.get('/owner/:address', async (req, res, next) => {
  try {
    const { address } = req.params;

    const objects = await suiClient.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::part::Part`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    res.json({
      success: true,
      parts: objects.data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
