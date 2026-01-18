import { VercelRequest, VercelResponse } from '@vercel/node';
import createApp from '../src/app';
import { connectDatabase } from '../src/config/database';

// Cache the app instance
let app: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Ensure database connection
    await connectDatabase();

    // Initialize app if not already done
    if (!app) {
        app = createApp();
    }

    // Handle the request
    return app(req, res);
}
