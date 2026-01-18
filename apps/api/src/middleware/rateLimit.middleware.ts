import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '@autoflow/shared';
import { RateLimitError } from '../utils/errors';

// Auth routes rate limiter (stricter)
export const authRateLimiter = rateLimit({
    windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
    max: RATE_LIMITS.AUTH.MAX_REQUESTS,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new RateLimitError('Too many authentication attempts'));
    },
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
    windowMs: RATE_LIMITS.API.WINDOW_MS,
    max: RATE_LIMITS.API.MAX_REQUESTS,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new RateLimitError('Too many requests'));
    },
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/ready';
    },
});
