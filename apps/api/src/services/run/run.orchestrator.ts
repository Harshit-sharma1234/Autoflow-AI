import { RunStatus, LogLevel, QUEUE_NAMES } from '@autoflow/shared';
import { Run, IRunDocument } from '../../models/run.model';
import { Log } from '../../models/log.model';
import { Workflow } from '../../models/workflow.model';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors';
import { createLogger } from '../../utils/logger';
import { documentQueue, aiQueue, actionQueue } from '../../queues';
import path from 'path';

const logger = createLogger('RunOrchestrator');

export class RunOrchestrator {
    // Create a new run
    async createRun(
        workflowId: string,
        userId: string,
        input: Record<string, unknown>
    ): Promise<string> {
        const workflow = await Workflow.findById(workflowId);
        if (!workflow) {
            throw new NotFoundError('Workflow');
        }

        const run = await Run.create({
            workflowId,
            userId,
            status: RunStatus.PENDING,
            input,
            startedAt: new Date(),
        });

        // Log run creation
        await this.addLog(run._id.toString(), LogLevel.INFO, 'Run created');

        // If input contains a file, process it first
        if (input.filePath || input.fileId) {
            const filePath = (input.filePath as string) || path.join(__dirname, '../../uploads', input.fileId as string);
            const fileType = (input.fileType as string) || 'application/pdf';
            
            await documentQueue.add('process', {
                runId: run._id.toString(),
                fileUrl: filePath,
                fileType,
            });
            
            await this.addLog(run._id.toString(), LogLevel.INFO, 'Document processing queued');
            
            // Don't queue the first step yet - wait for document processing to complete
            // The document worker will queue the first step after extraction
        } else {
            // Queue the first step
            const firstStep = workflow.steps[0];
            if (firstStep) {
                await this.queueStep(run._id.toString(), firstStep);
                await Run.findByIdAndUpdate(run._id, {
                    status: RunStatus.PROCESSING,
                    currentStepId: firstStep.id,
                });
            }
        }

        logger.info({ runId: run._id, workflowId }, 'Run created and queued');

        return run._id.toString();
    }

    // Get workflow for a run
    async getWorkflowForRun(runId: string): Promise<any> {
        const run = await Run.findById(runId);
        if (!run) return null;
        return await Workflow.findById(run.workflowId);
    }

    // Queue a step for processing
    async queueStep(runId: string, step: any): Promise<void> {
        const run = await Run.findById(runId);
        if (!run) return;

        switch (step.type) {
            case 'ai_process':
                await aiQueue.add('process', {
                    runId,
                    stepId: step.id,
                    prompt: step.config.prompt,
                    schema: step.config.schema,
                    model: step.config.model,
                });
                break;

            case 'email':
            case 'webhook':
            case 'save_data':
                await actionQueue.add('execute', {
                    runId,
                    stepId: step.id,
                    actionType: step.type,
                    config: step.config,
                    data: run.output || run.input,
                });
                break;

            default:
                logger.warn({ runId, stepType: step.type }, 'Unknown step type');
        }

        await this.addLog(runId, LogLevel.INFO, `Step ${step.name} queued`);
    }

    // Complete a step and move to next
    async completeStep(
        runId: string,
        stepId: string,
        output: Record<string, unknown>
    ): Promise<void> {
        const run = await Run.findById(runId).populate('workflowId');
        if (!run) {
            throw new NotFoundError('Run');
        }

        const workflow = await Workflow.findById(run.workflowId);
        if (!workflow) {
            throw new NotFoundError('Workflow');
        }

        // Find current step
        const currentStep = workflow.steps.find((s) => s.id === stepId);
        if (!currentStep) {
            throw new NotFoundError('Step');
        }

        // Update run output
        run.output = { ...run.output, ...output };
        await run.save();

        await this.addLog(runId, LogLevel.INFO, `Step ${currentStep.name} completed`);

        // Find and queue next step
        if (currentStep.nextStepId) {
            const nextStep = workflow.steps.find((s) => s.id === currentStep.nextStepId);
            if (nextStep) {
                await Run.findByIdAndUpdate(runId, { currentStepId: nextStep.id });
                await this.queueStep(runId, nextStep);
                return;
            }
        }

        // No next step - complete the run
        await this.completeRun(runId);
    }

    // Mark step as failed
    async failStep(runId: string, stepId: string, error: string): Promise<void> {
        const run = await Run.findById(runId);
        if (!run) return;

        const workflow = await Workflow.findById(run.workflowId);
        if (!workflow) return;

        const currentStep = workflow.steps.find((s) => s.id === stepId);
        if (!currentStep) return;

        await this.addLog(runId, LogLevel.ERROR, `Step ${currentStep.name} failed: ${error}`);

        // Check for error handler
        if (currentStep.onErrorStepId) {
            const errorStep = workflow.steps.find((s) => s.id === currentStep.onErrorStepId);
            if (errorStep) {
                await Run.findByIdAndUpdate(runId, { currentStepId: errorStep.id });
                await this.queueStep(runId, errorStep);
                return;
            }
        }

        // No error handler - fail the run
        await this.failRun(runId, error);
    }

    // Complete a run
    async completeRun(runId: string): Promise<void> {
        await Run.findByIdAndUpdate(runId, {
            status: RunStatus.COMPLETED,
            completedAt: new Date(),
            currentStepId: null,
        });

        await this.addLog(runId, LogLevel.INFO, 'Run completed successfully');
        logger.info({ runId }, 'Run completed');
    }

    // Fail a run
    async failRun(runId: string, error: string): Promise<void> {
        await Run.findByIdAndUpdate(runId, {
            status: RunStatus.FAILED,
            error,
            completedAt: new Date(),
            currentStepId: null,
        });

        await this.addLog(runId, LogLevel.ERROR, `Run failed: ${error}`);
        logger.error({ runId, error }, 'Run failed');
    }

    // Cancel a run
    async cancelRun(runId: string, userId: string): Promise<void> {
        const run = await Run.findById(runId);
        if (!run) {
            throw new NotFoundError('Run');
        }

        if (run.userId.toString() !== userId) {
            throw new AuthorizationError('You do not have access to this run');
        }

        if (!['pending', 'processing'].includes(run.status)) {
            throw new ValidationError('Run cannot be cancelled');
        }

        await Run.findByIdAndUpdate(runId, {
            status: RunStatus.CANCELLED,
            completedAt: new Date(),
            currentStepId: null,
        });

        await this.addLog(runId, LogLevel.WARN, 'Run cancelled by user');
        logger.info({ runId, userId }, 'Run cancelled');
    }

    // Add a log entry
    async addLog(
        runId: string,
        level: LogLevel,
        message: string,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await Log.create({
            runId,
            level,
            message,
            metadata,
            timestamp: new Date(),
        });
    }
}
