import Redis from 'ioredis';
import config from './index';
import { logger } from '../utils/logger';

// Check if we should use mock Redis
const useMockRedis = config.env === 'development' &&
    (!config.redis.url || config.redis.url === 'redis://localhost:6379');

let redis: Redis;
let bullMQConnection: { host: string; port: number; password?: string };

if (useMockRedis) {
    // Use ioredis-mock for development without Redis server
    const RedisMock = require('ioredis-mock');
    redis = new RedisMock();
    bullMQConnection = { host: 'localhost', port: 6379 };
    logger.info('Using in-memory Redis mock');
} else {
    // Parse Redis URL
    const parseRedisUrl = (url: string) => {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            password: parsed.password || undefined,
        };
    };

    const redisConfig = parseRedisUrl(config.redis.url);

    // Create Redis connection for general use
    redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
        retryStrategy: (times) => {
            if (times > 10) {
                logger.error('Redis connection failed after 10 retries');
                return null;
            }
            const delay = Math.min(times * 100, 3000);
            return delay;
        },
    });

    redis.on('connect', () => {
        logger.info('Redis connected');
    });

    redis.on('error', (err) => {
        logger.error('Redis error:', err);
    });

    redis.on('close', () => {
        logger.warn('Redis connection closed');
    });

    bullMQConnection = {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
    };
}

export { redis, bullMQConnection };

export const disconnectRedis = async (): Promise<void> => {
    if (!useMockRedis) {
        await redis.quit();
    }
    logger.info('Redis disconnected');
};
