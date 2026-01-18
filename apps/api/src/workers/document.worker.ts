import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES, IDocumentJob, LogLevel, RunStatus } from '@autoflow/shared';
import { bullMQConnection } from '../config/redis';
import { RunOrchestrator } from '../services/run/run.orchestrator';
import { Run } from '../models/run.model';
import { createLogger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

const logger = createLogger('DocumentWorker');
const runOrchestrator = new RunOrchestrator();

// Simple PDF text extraction
async function extractTextFromPDF(filePath: string): Promise<string> {
    try {
        logger.info({ filePath }, 'Attempting to parse PDF with pdf-parse');
        // Wait briefly for file write to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        logger.info({ filePath, textLength: data.text.length }, 'PDF parsed successfully');
        return data.text;
    } catch (error) {
        logger.error({ filePath, error }, 'PDF parsing failed');
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
}


// Extract text from various file types
async function extractText(filePath: string, fileType: string): Promise<string> {
    switch (fileType) {
        case 'application/pdf':
            return extractTextFromPDF(filePath);
        case 'text/plain':
        case 'text/markdown':
            return fs.readFile(filePath, 'utf-8');
        default:
            return fs.readFile(filePath, 'utf-8');
    }
}

// Document Processing Worker
export const documentWorker = new Worker<IDocumentJob>(
    QUEUE_NAMES.DOCUMENT_PROCESSING,
    async (job: Job<IDocumentJob>) => {
        const { runId, fileUrl, fileType } = job.data;

        logger.info({ jobId: job.id, runId, fileType }, 'Processing document');

        try {
            // Extract text from document
            const extractedText = await extractText(fileUrl, fileType);

            // Update run with extracted text
            const run = await Run.findById(runId);
            if (!run) {
                throw new Error('Run not found');
            }

            // Add extracted text to run input
            run.input = {
                ...run.input,
                extractedText,
                originalFile: fileUrl,
                fileType,
            };
            await run.save();

            await runOrchestrator.addLog(
                runId,
                LogLevel.INFO,
                `Document processed: ${extractedText.length} characters extracted`
            );

            logger.info({
                jobId: job.id,
                runId,
                charactersExtracted: extractedText.length
            }, 'Document processing completed');

            // After document processing, queue the first workflow step
            const workflow = await runOrchestrator.getWorkflowForRun(runId);
            if (workflow && workflow.steps.length > 0) {
                const firstStep = workflow.steps[0];
                await runOrchestrator.queueStep(runId, firstStep);
                await Run.findByIdAndUpdate(runId, {
                    status: RunStatus.PROCESSING,
                    currentStepId: firstStep.id,
                });
            }

            return { extractedText, length: extractedText.length };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error({ jobId: job.id, runId, error: errorMessage }, 'Document processing failed');

            await runOrchestrator.addLog(runId, LogLevel.ERROR, `Document processing failed: ${errorMessage}`);
            throw error;
        }
    },
    {
        connection: bullMQConnection,
        concurrency: 3,
    }
);

// Event handlers
documentWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Document worker job completed');
});

documentWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Document worker job failed');
});

let docWorkerErrorLogged = false;
documentWorker.on('error', (err) => {
    if (!docWorkerErrorLogged && process.env.NODE_ENV === 'development') {
        docWorkerErrorLogged = true;
        logger.warn('Document worker using in-memory mock - async document processing disabled');
    } else if (process.env.NODE_ENV !== 'development') {
        logger.error({ error: err.message }, 'Document worker error');
    }
});

export default documentWorker;
