import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError, ValidationError, buildErrorResponse } from '../utils/errors';
import { logger } from '../utils/logger';

// Global error handler middleware
export const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log the error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
    });

    // Handle known error types
    let appError: AppError;

    if (err instanceof AppError) {
        appError = err;
    } else if (err instanceof ZodError) {
        // Zod validation errors
        appError = new ValidationError('Validation failed', err.errors);
    } else if (err instanceof mongoose.Error.ValidationError) {
        // Mongoose validation errors
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        appError = new ValidationError('Validation failed', details);
    } else if (err instanceof mongoose.Error.CastError) {
        // Invalid MongoDB ObjectId
        appError = new ValidationError(`Invalid ${err.path}: ${err.value}`);
    } else if ((err as any).code === 11000) {
        // MongoDB duplicate key error
        const field = Object.keys((err as any).keyValue || {})[0] || 'field';
        appError = new ValidationError(`${field} already exists`);
    } else if (err.name === 'JsonWebTokenError') {
        appError = new AppError('Invalid token', 401, 'INVALID_TOKEN');
    } else if (err.name === 'TokenExpiredError') {
        appError = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    } else {
        // Unknown errors
        appError = new AppError(
            process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
            500,
            'INTERNAL_ERROR'
        );
    }

    res.status(appError.statusCode).json(buildErrorResponse(appError));
};

// Handle 404 for undefined routes
export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const error = new AppError(
        `Route ${req.method} ${req.path} not found`,
        404,
        'ROUTE_NOT_FOUND'
    );
    res.status(404).json(buildErrorResponse(error));
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = <T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
