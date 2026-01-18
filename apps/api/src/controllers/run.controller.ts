import { Request, Response } from 'express';
import { Run } from '../models/run.model';
import { Log } from '../models/log.model';
import { AIOutput } from '../models/aiOutput.model';
import { RunOrchestrator } from '../services/run/run.orchestrator';
import { buildSuccessResponse } from '../utils/errors';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { PAGINATION } from '@autoflow/shared';

export class RunController {
    private runOrchestrator: RunOrchestrator;

    constructor() {
        this.runOrchestrator = new RunOrchestrator();
    }

    list = async (req: Request, res: Response): Promise<void> => {
        const { page = 1, limit = 20, status, workflowId } = req.query;

        const query: Record<string, unknown> = { userId: req.user!.id };
        if (status) query.status = status;
        if (workflowId) query.workflowId = workflowId;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), PAGINATION.MAX_LIMIT);

        const [runs, total] = await Promise.all([
            Run.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .populate('workflowId', 'name'),
            Run.countDocuments(query),
        ]);

        res.json(buildSuccessResponse(runs, { page: pageNum, limit: limitNum, total }));
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        const run = await Run.findById(req.params.id).populate('workflowId', 'name steps');

        if (!run) {
            throw new NotFoundError('Run');
        }

        if (run.userId.toString() !== req.user!.id) {
            throw new AuthorizationError('You do not have access to this run');
        }

        res.json(buildSuccessResponse(run));
    };

    getLogs = async (req: Request, res: Response): Promise<void> => {
        const run = await Run.findById(req.params.id);

        if (!run) {
            throw new NotFoundError('Run');
        }

        if (run.userId.toString() !== req.user!.id) {
            throw new AuthorizationError('You do not have access to this run');
        }

        const logs = await Log.find({ runId: req.params.id })
            .sort({ timestamp: 1 })
            .limit(1000);

        res.json(buildSuccessResponse(logs));
    };

    getOutputs = async (req: Request, res: Response): Promise<void> => {
        const run = await Run.findById(req.params.id);

        if (!run) {
            throw new NotFoundError('Run');
        }

        if (run.userId.toString() !== req.user!.id) {
            throw new AuthorizationError('You do not have access to this run');
        }

        const outputs = await AIOutput.find({ runId: req.params.id })
            .sort({ createdAt: 1 });

        res.json(buildSuccessResponse(outputs));
    };

    cancel = async (req: Request, res: Response): Promise<void> => {
        await this.runOrchestrator.cancelRun(req.params.id, req.user!.id);
        res.json(buildSuccessResponse({ message: 'Run cancelled' }));
    };

    retry = async (req: Request, res: Response): Promise<void> => {
        const run = await Run.findById(req.params.id);

        if (!run) {
            throw new NotFoundError('Run');
        }

        if (run.userId.toString() !== req.user!.id) {
            throw new AuthorizationError('You do not have access to this run');
        }

        // Create a new run with the same input
        const newRunId = await this.runOrchestrator.createRun(
            run.workflowId.toString(),
            req.user!.id,
            run.input
        );

        res.status(202).json(buildSuccessResponse({ runId: newRunId }));
    };
}
