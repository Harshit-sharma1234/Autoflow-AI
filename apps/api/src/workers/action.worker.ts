import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES, IActionJob, StepType, LogLevel } from '@autoflow/shared';
import { bullMQConnection } from '../config/redis';
import { RunOrchestrator } from '../services/run/run.orchestrator';
import { replaceTemplateVariables } from '../services/ai/templates';
import { sendEmail } from '../services/email/email.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('ActionWorker');
const runOrchestrator = new RunOrchestrator();

// Email action handler
async function handleEmailAction(
    config: Record<string, unknown>,
    data: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const context = {
        ...data,
        timestamp: new Date().toLocaleString(),
    };
    const to = replaceTemplateVariables(config.to as string, context);
    const subject = replaceTemplateVariables(config.subject as string, context);
    const body = replaceTemplateVariables((config.body || config.template) as string, context);

    // Send email using the email service
    const result = await sendEmail({
        to,
        subject,
        body,
    });

    logger.info({ to, subject, success: result.success }, 'Email action executed');

    return {
        action: 'email',
        to,
        subject,
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toISOString(),
    };
}

// Webhook action handler
async function handleWebhookAction(
    config: Record<string, unknown>,
    data: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const url = config.url as string;
    const method = (config.method as string) || 'POST';
    const headers = (config.headers as Record<string, string>) || {};

    let body: string | undefined;
    if (config.bodyTemplate) {
        body = replaceTemplateVariables(config.bodyTemplate as string, data);
    } else {
        body = JSON.stringify(data);
    }

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: method !== 'GET' ? body : undefined,
    });

    const responseData = await response.json().catch(() => ({}));

    logger.info({ url, method, status: response.status }, 'Webhook action executed');

    return {
        action: 'webhook',
        url,
        method,
        status: response.status,
        response: responseData,
        timestamp: new Date().toISOString(),
    };
}

// Save data action handler (placeholder)
async function handleSaveDataAction(
    config: Record<string, unknown>,
    data: Record<string, unknown>
): Promise<Record<string, unknown>> {
    const collection = (config?.collection as string) || 'default';
    const mapping = (config?.mapping as Record<string, string>) || {};

    // Map data according to config (if mapping exists)
    const mappedData: Record<string, unknown> = {};
    if (mapping && typeof mapping === 'object') {
        for (const [targetField, sourceField] of Object.entries(mapping)) {
            mappedData[targetField] = data[sourceField];
        }
    } else {
        // If no mapping, just save all data
        Object.assign(mappedData, data);
    }

    // TODO: Implement actual data saving
    logger.info({ collection }, 'Save data action executed (placeholder)');

    return {
        action: 'save_data',
        collection,
        savedData: mappedData,
        timestamp: new Date().toISOString(),
    };
}

// Action Execution Worker
export const actionWorker = new Worker<IActionJob>(
    QUEUE_NAMES.ACTION_EXECUTION,
    async (job: Job<IActionJob>) => {
        const { runId, stepId, actionType, config, data } = job.data;

        logger.info({ jobId: job.id, runId, stepId, actionType }, 'Executing action');

        try {
            let result: Record<string, unknown>;

            switch (actionType) {
                case StepType.EMAIL:
                    result = await handleEmailAction(config, data);
                    break;
                case StepType.WEBHOOK:
                    result = await handleWebhookAction(config, data);
                    break;
                case StepType.SAVE_DATA:
                    result = await handleSaveDataAction(config, data);
                    break;
                default:
                    throw new Error(`Unknown action type: ${actionType}`);
            }

            // Complete step and move to next
            await runOrchestrator.completeStep(runId, stepId, { [stepId]: result });

            logger.info({ jobId: job.id, runId, stepId, actionType }, 'Action completed');

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error({ jobId: job.id, runId, stepId, error: errorMessage }, 'Action failed');

            await runOrchestrator.failStep(runId, stepId, errorMessage);
            throw error;
        }
    },
    {
        connection: bullMQConnection,
        concurrency: 10,
    }
);

// Event handlers
actionWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Action worker job completed');
});

actionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Action worker job failed');
});

actionWorker.on('error', (err) => {
    logger.error({ error: err.message }, 'Action worker error');
});

export default actionWorker;
