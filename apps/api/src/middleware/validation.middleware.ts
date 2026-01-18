import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

// Validation middleware factory
export const validateRequest = (schema: AnyZodObject) => {
    return async (
        req: Request,
        _res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const details = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));
                next(new ValidationError('Validation failed', details));
            } else {
                next(error);
            }
        }
    };
};
