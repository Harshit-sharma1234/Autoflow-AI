import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ITokenPayload, UserRole } from '@autoflow/shared';
import config from '../config';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { User } from '../models/user.model';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: ITokenPayload & { id: string };
        }
    }
}

// Authenticate middleware - verifies JWT token
export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret) as ITokenPayload;

        // Verify user still exists
        const user = await User.findById(decoded.userId).select('email role');
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        // Attach user to request
        req.user = {
            id: decoded.userId,
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AuthenticationError('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AuthenticationError('Token expired'));
        } else {
            next(error);
        }
    }
};

// Authorization middleware - checks user roles
export const authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AuthenticationError('Not authenticated');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AuthorizationError('Insufficient permissions');
        }

        next();
    };
};

// Optional auth - doesn't throw if no token, but attaches user if valid
export const optionalAuth = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, config.jwt.secret) as ITokenPayload;

        req.user = {
            id: decoded.userId,
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch {
        // Ignore errors - token is optional
        next();
    }
};
