import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import routes from './routes';
import config from './config';

const createApp = (): Application => {
    const app = express();

    // Security middleware
    app.use(helmet());

    // CORS configuration
    app.use(cors({
        origin: config.env === 'production'
            ? ['https://autoflow.ai'] // Replace with actual frontend URL
            : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    app.use(requestLogger);

    // Health check endpoint (before auth)
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env: config.env,
        });
    });

    app.get('/ready', (req, res) => {
        // Could add database connectivity checks here
        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    });

    // API routes
    app.use('/api', routes);

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler
    app.use(errorHandler);

    return app;
};

export default createApp;
