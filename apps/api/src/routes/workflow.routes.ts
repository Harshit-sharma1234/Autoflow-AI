import { Router } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createWorkflowSchema, updateWorkflowSchema } from '../validators/workflow.validator';

const router: Router = Router();
const workflowController = new WorkflowController();

// All workflow routes require authentication
router.use(authenticate);

// CRUD operations
router.get('/', asyncHandler(workflowController.list));
router.get('/:id', asyncHandler(workflowController.getById));
router.post(
    '/',
    validateRequest(createWorkflowSchema),
    asyncHandler(workflowController.create)
);
router.patch(
    '/:id',
    validateRequest(updateWorkflowSchema),
    asyncHandler(workflowController.update)
);
router.delete('/:id', asyncHandler(workflowController.delete));

// Workflow actions
router.post('/:id/trigger', asyncHandler(workflowController.trigger));
router.post('/:id/activate', asyncHandler(workflowController.activate));
router.post('/:id/pause', asyncHandler(workflowController.pause));

export default router;
