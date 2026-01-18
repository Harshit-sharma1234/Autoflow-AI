import { Router } from 'express';
import { RunController } from '../controllers/run.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router: Router = Router();
const runController = new RunController();

// All run routes require authentication
router.use(authenticate);

// List runs with filtering
router.get('/', asyncHandler(runController.list));

// Get run by ID with details
router.get('/:id', asyncHandler(runController.getById));

// Get run logs
router.get('/:id/logs', asyncHandler(runController.getLogs));

// Get AI outputs for a run
router.get('/:id/outputs', asyncHandler(runController.getOutputs));

// Cancel a running job
router.post('/:id/cancel', asyncHandler(runController.cancel));

// Retry a failed run
router.post('/:id/retry', asyncHandler(runController.retry));

export default router;
