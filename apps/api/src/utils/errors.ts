import { IApiResponse } from '@autoflow/shared';

// Custom error class with status code
export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public isOperational: boolean;
    public details?: unknown;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}

// Error response builder
export const buildErrorResponse = (error: AppError): IApiResponse => ({
    success: false,
    error: {
        code: error.code,
        message: error.message,
        details: error.details,
    },
});

// Success response builder
export const buildSuccessResponse = <T>(
    data: T,
    meta?: IApiResponse['meta']
): IApiResponse<T> => ({
    success: true,
    data,
    meta,
});
