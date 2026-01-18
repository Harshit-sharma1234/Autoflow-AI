import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();
const fileController = new FileController();

// All file routes require authentication
router.use(authenticate);

// Upload file
router.post(
    '/upload',
    uploadMiddleware.single('file'),
    asyncHandler(fileController.upload)
);

// Get file info
router.get('/:id', asyncHandler(fileController.getById));

// Delete file
router.delete('/:id', asyncHandler(fileController.delete));

export default router;
