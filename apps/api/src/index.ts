import 'dotenv/config';

import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from './app';
import config from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';
import { closeQueues } from './queues';
console.log("MONGO FROM ENV =>", process.env.MONGODB_URI);

let mongoServer: MongoMemoryServer | null = null;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal');

    try {
        await closeQueues();
        await disconnectDatabase();
        if (mongoServer) {
            await mongoServer.stop();
        }

        logger.info('Graceful shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
    process.exit(1);
});

const startServer = async (): Promise<void> => {
    try {
        // Use in-memory MongoDB for development if MONGODB_URI is not explicitly set or is default localhost
        const shouldUseInMemory = config.env === 'development' &&
            (!process.env.MONGODB_URI || config.mongodb.uri === 'mongodb://localhost:27017/autoflow' || !config.mongodb.uri);

        if (shouldUseInMemory) {
            logger.info('Starting MongoDB Memory Server...');
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            process.env.MONGODB_URI = mongoUri;
            // Update config with the new URI
            (config.mongodb as any).uri = mongoUri;
            logger.info({ uri: mongoUri }, 'MongoDB Memory Server started');
        }

        // Update config with new URI
        await connectDatabase();

        // Start workers (AI, Document, Action)
        await import('./workers');
        logger.info('Background workers initialized');

        const app = createApp();
        app.listen(config.port, () => {
            logger.info({
                port: config.port,
                env: config.env,
                mongodb: mongoServer ? 'in-memory' : 'external',
            }, 'Server started');
        });
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
};

startServer();
