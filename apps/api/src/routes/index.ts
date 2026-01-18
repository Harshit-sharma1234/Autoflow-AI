import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import workflowRoutes from './workflow.routes';
import runRoutes from './run.routes';
import fileRoutes from './file.routes';

const router: Router = Router();

// API version prefix
const API_VERSION = '/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/workflows`, workflowRoutes);
router.use(`${API_VERSION}/runs`, runRoutes);
router.use(`${API_VERSION}/files`, fileRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'AutoFlow AI API',
        version: '1.0.0',
        endpoints: {
            auth: `${API_VERSION}/auth`,
            users: `${API_VERSION}/users`,
            workflows: `${API_VERSION}/workflows`,
            runs: `${API_VERSION}/runs`,
            files: `${API_VERSION}/files`,
        },
    });
});

export default router;
