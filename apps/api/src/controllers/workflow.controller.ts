import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflow/workflow.service';
import { buildSuccessResponse } from '../utils/errors';
import { WorkflowStatus, PAGINATION } from '@autoflow/shared';

export class WorkflowController {
    private workflowService: WorkflowService;

    constructor() {
        this.workflowService = new WorkflowService();
    }

    list = async (req: Request, res: Response): Promise<void> => {
        const { page, limit, sortBy, sortOrder, status } = req.query;

        const result = await this.workflowService.list(req.user!.id, {
            page: page ? parseInt(page as string, 10) : PAGINATION.DEFAULT_PAGE,
            limit: limit ? parseInt(limit as string, 10) : PAGINATION.DEFAULT_LIMIT,
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
            status: status as WorkflowStatus,
        });

        res.json(buildSuccessResponse(result.workflows, {
            page: parseInt(page as string, 10) || PAGINATION.DEFAULT_PAGE,
            limit: parseInt(limit as string, 10) || PAGINATION.DEFAULT_LIMIT,
            total: result.total,
        }));
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        const workflow = await this.workflowService.getById(req.params.id, req.user!.id);
        res.json(buildSuccessResponse(workflow));
    };

    create = async (req: Request, res: Response): Promise<void> => {
        const workflow = await this.workflowService.create(req.user!.id, req.body);
        res.status(201).json(buildSuccessResponse(workflow));
    };

    update = async (req: Request, res: Response): Promise<void> => {
        const workflow = await this.workflowService.update(req.params.id, req.user!.id, req.body);
        res.json(buildSuccessResponse(workflow));
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        await this.workflowService.delete(req.params.id, req.user!.id);
        res.status(204).send();
    };

    trigger = async (req: Request, res: Response): Promise<void> => {
        const runId = await this.workflowService.trigger(
            req.params.id,
            req.user!.id,
            req.body.input || {}
        );
        res.status(202).json(buildSuccessResponse({ runId }));
    };

    activate = async (req: Request, res: Response): Promise<void> => {
        const workflow = await this.workflowService.activate(req.params.id, req.user!.id);
        res.json(buildSuccessResponse(workflow));
    };

    pause = async (req: Request, res: Response): Promise<void> => {
        const workflow = await this.workflowService.pause(req.params.id, req.user!.id);
        res.json(buildSuccessResponse(workflow));
    };
}
