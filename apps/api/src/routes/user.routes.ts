import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@autoflow/shared';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize([UserRole.ADMIN]), (req, res) => {
    // TODO: Implement user listing
    res.json({ message: 'List users - not yet implemented' });
});

// Get user by ID
router.get('/:id', (req, res) => {
    // TODO: Implement get user
    res.json({ message: 'Get user - not yet implemented' });
});

// Update user
router.patch('/:id', (req, res) => {
    // TODO: Implement update user
    res.json({ message: 'Update user - not yet implemented' });
});

// Delete user (admin only)
router.delete('/:id', authorize([UserRole.ADMIN]), (req, res) => {
    // TODO: Implement delete user
    res.json({ message: 'Delete user - not yet implemented' });
});

export default router;
