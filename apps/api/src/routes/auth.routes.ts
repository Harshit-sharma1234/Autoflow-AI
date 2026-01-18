import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/error.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();

// Apply rate limiting to auth routes
router.use(authRateLimiter);

// Public routes
router.post(
    '/register',
    validateRequest(registerSchema),
    asyncHandler(authController.register)
);

router.post(
    '/login',
    validateRequest(loginSchema),
    asyncHandler(authController.login)
);

router.post(
    '/refresh',
    validateRequest(refreshTokenSchema),
    asyncHandler(authController.refresh)
);

// Protected routes
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
