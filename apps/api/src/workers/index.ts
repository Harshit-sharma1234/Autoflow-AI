import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import aiWorker from './ai.worker';
import documentWorker from './document.worker';
import actionWorker from './action.worker';

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down workers');

    await Promise.all([
        aiWorker.close(),
        documentWorker.close(),
        actionWorker.close(),
    ]);

    logger.info('Workers closed');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

const startWorkers = async (): Promise<void> => {
    try {
        // Connect to database
        await connectDatabase();

        logger.info('Workers started');
        logger.info({
            workers: ['ai', 'document', 'action'],
        }, 'Active workers');
    } catch (error) {
        logger.error({ error }, 'Failed to start workers');
        process.exit(1);
    }
};

startWorkers();

export { aiWorker, documentWorker, actionWorker };
