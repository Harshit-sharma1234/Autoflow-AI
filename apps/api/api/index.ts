import { VercelRequest, VercelResponse } from '@vercel/node';
import createApp from '../src/app';
import { connectDatabase } from '../src/config/database';
import { validateConfig } from '../src/config';

// Cache the app instance
let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // 1. Validate environment variables
        validateConfig();

        // 2. Ensure database connection
        await connectDatabase();

        // 3. Initialize app if not already done
        if (!app) {
            app = createApp();
        }

        // 4. Handle the request
        return app(req, res);
    } catch (error: any) {
        console.error('SERVERLESS FUNCTION CRASH:', error);

        // Return the actual error to the client for debugging
        res.status(500).json({
            error: 'Serverless Function Crashed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            details: 'Check Vercel Function Logs for more info'
        });
    }
}
