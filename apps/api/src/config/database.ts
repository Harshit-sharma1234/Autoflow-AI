import mongoose from 'mongoose';
import config from './index';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(config.mongodb.uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });

    } catch (error) {
        console.error("🔥🔥🔥 REAL MONGO ERROR OBJECT:", error);

        if (error instanceof Error) {
            console.error("🔥 MESSAGE:", error.message);
            console.error("🔥 NAME:", error.name);
            // @ts-ignore
            console.error("🔥 STACK:", error.stack);
        }

        process.exit(1);
    }

};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
    }
};
