import { Worker, Job, UnrecoverableError } from 'bullmq';
import { QUEUE_NAMES, LogLevel, IAIJob } from '@autoflow/shared';
import { bullMQConnection } from '../config/redis';
import { aiService } from '../services/ai/ai.service';
import { RunOrchestrator } from '../services/run/run.orchestrator';
import { replaceTemplateVariables } from '../services/ai/templates';
import { Run } from '../models/run.model';
import { createLogger } from '../utils/logger';

const logger = createLogger('AIWorker');
const runOrchestrator = new RunOrchestrator();

// AI Processing Worker
export const aiWorker = new Worker<IAIJob>(
    QUEUE_NAMES.AI_PROCESSING,
    async (job: Job<IAIJob>) => {
        const { runId, stepId, prompt, schema, model } = job.data;

        logger.info({ jobId: job.id, runId, stepId }, 'Processing AI job');

        try {
            // Get run data for variable replacement
            const run = await Run.findById(runId);
            if (!run) {
                throw new Error('Run not found');
            }

            // Replace template variables in prompt
            const processedPrompt = replaceTemplateVariables(prompt, {
                ...run.input,
                ...run.output,
            });

            // Default schema if not provided
            const outputSchema = schema || {
                type: 'object',
                properties: {
                    result: { type: 'string' },
                },
            };

            // Process with AI
            const result = await aiService.processWithSchema(
                runId,
                stepId,
                processedPrompt,
                outputSchema,
                { model }
            );

            // Complete step and move to next
            await runOrchestrator.completeStep(runId, stepId, { [stepId]: result });

            logger.info({ jobId: job.id, runId, stepId }, 'AI job completed');

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error({ jobId: job.id, runId, stepId, error: errorMessage }, 'AI job failed');

            await runOrchestrator.failStep(runId, stepId, errorMessage);

            // Check if this is a quota/rate limit error - if so, don't retry
            const isQuotaError = errorMessage.includes('429') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('rate limit') ||
                errorMessage.includes('Too Many Requests');

            if (isQuotaError) {
                // UnrecoverableError tells BullMQ to NOT retry this job
                throw new UnrecoverableError('Quota exceeded - not retrying: ' + errorMessage);
            }

            throw error;
        }
    },
    {
        connection: bullMQConnection,
        concurrency: 5,
        limiter: {
            max: 10,
            duration: 1000, // Max 10 jobs per second
        },
    }
);

// Event handlers
aiWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'AI worker job completed');
});

aiWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'AI worker job failed');
});

aiWorker.on('error', (err) => {
    logger.error({ error: err.message }, 'AI worker error');
});

export default aiWorker;
