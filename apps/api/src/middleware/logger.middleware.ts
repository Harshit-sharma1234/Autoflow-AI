import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, logRequest } from '../utils/logger';

// Add request ID and timing to requests
export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Generate unique request ID
    const requestId = uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Record start time
    const startTime = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;

        logRequest({
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            userId: (req as any).user?.id,
            ip: req.ip || req.socket.remoteAddress,
        });
    });

    next();
};

// Skip logging for health checks
export const skipHealthCheckLogs = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (req.path === '/health' || req.path === '/ready') {
        // Don't log health checks
        res.on('finish', () => { }); // Override the finish handler
    }
    next();
};
