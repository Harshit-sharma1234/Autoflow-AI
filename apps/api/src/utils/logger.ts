import pino from 'pino';
import config from '../config';

const isDevelopment = config.env === 'development';

export const logger = pino({
    level: config.logging.level,
    transport: process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        env: config.env,
    },
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
});

// Create a child logger for specific modules
export const createLogger = (module: string) => {
    return logger.child({ module });
};

// Request logger helper
export interface RequestLogData {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    userId?: string;
    ip?: string;
}

export const logRequest = (data: RequestLogData) => {
    const { statusCode, responseTime, ...rest } = data;

    if (statusCode >= 500) {
        logger.error({ ...rest, statusCode, responseTime }, 'Request failed');
    } else if (statusCode >= 400) {
        logger.warn({ ...rest, statusCode, responseTime }, 'Client error');
    } else {
        logger.info({ ...rest, statusCode, responseTime }, 'Request completed');
    }
};
