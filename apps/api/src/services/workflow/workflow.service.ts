import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { IWorkflow, WorkflowStatus, IPaginationParams, PAGINATION } from '@autoflow/shared';
import { Workflow, IWorkflowDocument } from '../../models/workflow.model';
import { Run } from '../../models/run.model';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import { RunOrchestrator } from '../run/run.orchestrator';

const logger = createLogger('WorkflowService');

export class WorkflowService {
    private runOrchestrator: RunOrchestrator;

    constructor() {
        this.runOrchestrator = new RunOrchestrator();
    }

    // List workflows for a user
    async list(
        userId: string,
        params: IPaginationParams & { status?: WorkflowStatus }
    ): Promise<{ workflows: IWorkflow[]; total: number }> {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            limit = PAGINATION.DEFAULT_LIMIT,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
        } = params;

        const query: Record<string, unknown> = { userId };
        if (status) {
            query.status = status;
        }

        const [workflows, total] = await Promise.all([
            Workflow.find(query)
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip((page - 1) * limit)
                .limit(Math.min(limit, PAGINATION.MAX_LIMIT)),
            Workflow.countDocuments(query),
        ]);

        return {
            workflows: workflows.map(this.formatWorkflow),
            total,
        };
    }

    // Get workflow by ID
    async getById(workflowId: string, userId: string): Promise<IWorkflow> {
        const workflow = await Workflow.findById(workflowId);
        if (!workflow) {
            throw new NotFoundError('Workflow');
        }

        if (workflow.userId.toString() !== userId) {
            throw new AuthorizationError('You do not have access to this workflow');
        }

        return this.formatWorkflow(workflow);
    }

    // Create a new workflow
    async create(
        userId: string,
        data: {
            name: string;
            description?: string;
            trigger: IWorkflow['trigger'];
            steps: Omit<IWorkflow['steps'][0], 'id'>[];
        }
    ): Promise<IWorkflow> {
        try {
            // Add IDs to steps
            const stepsWithIds = data.steps.map((step) => ({
                ...step,
                id: uuidv4(),
            }));

            logger.info({ userId, stepCount: stepsWithIds.length }, 'Creating workflow');

            // Convert userId to ObjectId if it's a string
            const userIdObjectId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : userId;

            const workflow = await Workflow.create({
                userId: userIdObjectId,
                name: data.name,
                description: data.description,
                trigger: data.trigger,
                steps: stepsWithIds,
                status: WorkflowStatus.DRAFT,
            });

            logger.info({ workflowId: workflow._id, userId }, 'Workflow created successfully');

            return this.formatWorkflow(workflow);
        } catch (error) {
            logger.error({ userId, error: error instanceof Error ? error.message : String(error) }, 'Failed to create workflow');
            throw error;
        }
    }

    // Update a workflow
    async update(
        workflowId: string,
        userId: string,
        data: Partial<{
            name: string;
            description: string;
            trigger: IWorkflow['trigger'];
            steps: IWorkflow['steps'];
            status: WorkflowStatus;
        }>
    ): Promise<IWorkflow> {
        const workflow = await Workflow.findById(workflowId);
        if (!workflow) {
            throw new NotFoundError('Workflow');
        }

        if (workflow.userId.toString() !== userId) {
            throw new AuthorizationError('You do not have access to this workflow');
        }

        // Update fields
        if (data.name !== undefined) workflow.name = data.name;
        if (data.description !== undefined) workflow.description = data.description;
        if (data.trigger !== undefined) workflow.trigger = data.trigger;
        if (data.steps !== undefined) workflow.steps = data.steps;
        if (data.status !== undefined) workflow.status = data.status;

        await workflow.save();

        logger.info({ workflowId, userId }, 'Workflow updated');

        return this.formatWorkflow(workflow);
    }

    // Delete a workflow
    async delete(workflowId: string, userId: string): Promise<void> {
        const workflow = await Workflow.findById(workflowId);
        if (!workflow) {
            throw new NotFoundError('Workflow');
        }

        if (workflow.userId.toString() !== userId) {
            throw new AuthorizationError('You do not have access to this workflow');
        }

        // Check for running executions
        const runningRuns = await Run.countDocuments({
            workflowId,
            status: { $in: ['pending', 'processing'] },
        });

        if (runningRuns > 0) {
            throw new ValidationError('Cannot delete workflow with running executions');
        }

        await workflow.deleteOne();

        logger.info({ workflowId, userId }, 'Workflow deleted');
    }

    // Trigger a workflow
    async trigger(
        workflowId: string,
        userId: string,
        input: Record<string, unknown>
    ): Promise<string> {
        const workflow = await Workflow.findById(workflowId);
        if (!workflow) {
            throw new NotFoundError('Workflow');
        }

        if (workflow.userId.toString() !== userId) {
            throw new AuthorizationError('You do not have access to this workflow');
        }

        if (workflow.status !== WorkflowStatus.ACTIVE) {
            throw new ValidationError('Workflow must be active to trigger');
        }

        // Create run via orchestrator
        const runId = await this.runOrchestrator.createRun(workflowId, userId, input);

        logger.info({ workflowId, runId, userId }, 'Workflow triggered');

        return runId;
    }

    // Activate a workflow
    async activate(workflowId: string, userId: string): Promise<IWorkflow> {
        return this.update(workflowId, userId, { status: WorkflowStatus.ACTIVE });
    }

    // Pause a workflow
    async pause(workflowId: string, userId: string): Promise<IWorkflow> {
        return this.update(workflowId, userId, { status: WorkflowStatus.PAUSED });
    }

    // Format workflow for response
    private formatWorkflow(workflow: IWorkflowDocument): IWorkflow {
        return {
            id: workflow._id.toString(),
            userId: workflow.userId.toString(),
            name: workflow.name,
            description: workflow.description,
            trigger: workflow.trigger,
            steps: workflow.steps,
            status: workflow.status,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
        };
    }
}
