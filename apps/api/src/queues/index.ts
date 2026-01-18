import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@autoflow/shared';
import { bullMQConnection } from '../config/redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('Queues');

// Queue options
const defaultQueueOptions = {
    connection: bullMQConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential' as const,
            delay: 1000,
        },
        removeOnComplete: {
            count: 100,
            age: 24 * 60 * 60, // 24 hours
        },
        removeOnFail: {
            count: 1000,
            age: 7 * 24 * 60 * 60, // 7 days
        },
    },
};

// Document processing queue
export const documentQueue = new Queue(QUEUE_NAMES.DOCUMENT_PROCESSING, {
    ...defaultQueueOptions,
    defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 3,
    },
});

// AI processing queue
export const aiQueue = new Queue(QUEUE_NAMES.AI_PROCESSING, {
    ...defaultQueueOptions,
    defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000, // AI calls need longer backoff
        },
    },
});

// Action execution queue
export const actionQueue = new Queue(QUEUE_NAMES.ACTION_EXECUTION, {
    ...defaultQueueOptions,
    defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        attempts: 5,
    },
});

// Log queue events (suppress spam in dev mode with in-memory Redis)
const loggedQueueErrors = new Set<string>();
[documentQueue, aiQueue, actionQueue].forEach((queue) => {
    queue.on('error', (err) => {
        // Only log each queue error once to avoid spam
        if (!loggedQueueErrors.has(queue.name)) {
            loggedQueueErrors.add(queue.name);
            if (process.env.NODE_ENV !== 'development') {
                logger.error({ queue: queue.name, error: err.message }, 'Queue error');
            } else {
                logger.warn({ queue: queue.name }, 'Queue using in-memory mock - some features disabled');
            }
        }
    });
});

logger.info('Queues initialized');

export const closeQueues = async (): Promise<void> => {
    await Promise.all([
        documentQueue.close(),
        aiQueue.close(),
        actionQueue.close(),
    ]);
    logger.info('Queues closed');
};
