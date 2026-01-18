import { z } from 'zod';
import { TriggerType, StepType, WorkflowStatus } from '@autoflow/shared';

// Step configuration schemas based on step type
const aiProcessConfigSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    model: z.string().optional(),
    schema: z.record(z.unknown()).optional(),
    temperature: z.number().min(0).max(2).optional(),
});

// Helper to validate email or template string
const emailOrTemplate = z.string().min(1).refine(
    (val) => {
        // Allow email format or template strings starting with {{
        return z.string().email().safeParse(val).success || val.startsWith('{{');
    },
    {
        message: 'Must be a valid email address or a template string (e.g., {{user.email}})',
    }
);

// Helper to validate URL or template string
const urlOrTemplate = z.string().min(1).refine(
    (val) => {
        // Allow valid URL or template strings starting with {{
        return z.string().url().safeParse(val).success || val.startsWith('{{');
    },
    {
        message: 'Must be a valid URL or a template string (e.g., {{webhookUrl}})',
    }
);

const emailConfigSchema = z.object({
    to: emailOrTemplate,
    subject: z.string().min(1, 'Email subject is required'),
    template: z.string().optional(),
    body: z.string().optional(),
});

const webhookConfigSchema = z.object({
    url: urlOrTemplate,
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
    headers: z.record(z.string()).optional(),
    bodyTemplate: z.string().optional(),
}).transform((data) => ({
    ...data,
    method: data.method || 'POST',
}));

const saveDataConfigSchema = z.object({
    collection: z.string().min(1, 'Collection name is required'),
    mapping: z.record(z.string()).optional(),
});

const conditionConfigSchema = z.object({
    expression: z.string().min(1, 'Condition expression is required'),
    thenStepId: z.string().optional(),
    elseStepId: z.string().optional(),
});

const transformConfigSchema = z.object({
    expression: z.string().optional(),
});

// Workflow step schema with discriminated union for config validation
const workflowStepSchema = z.discriminatedUnion('type', [
    z.object({
        name: z.string().min(1, 'Step name is required'),
        type: z.literal(StepType.AI_PROCESS),
        config: aiProcessConfigSchema,
        nextStepId: z.string().optional(),
        onErrorStepId: z.string().optional(),
    }),
    z.object({
        name: z.string().min(1, 'Step name is required'),
        type: z.literal(StepType.EMAIL),
        config: emailConfigSchema,
        nextStepId: z.string().optional(),
        onErrorStepId: z.string().optional(),
    }),
    z.object({
        name: z.string().min(1, 'Step name is required'),
        type: z.literal(StepType.WEBHOOK),
        config: webhookConfigSchema,
        nextStepId: z.string().optional(),
        onErrorStepId: z.string().optional(),
    }),
    z.object({
        name: z.string().min(1, 'Step name is required'),
        type: z.literal(StepType.SAVE_DATA),
        config: saveDataConfigSchema,
        nextStepId: z.string().optional(),
        onErrorStepId: z.string().optional(),
    }),
    z.object({
        name: z.string().min(1, 'Step name is required'),
        type: z.literal(StepType.CONDITION),
        config: conditionConfigSchema,
        nextStepId: z.string().optional(),
        onErrorStepId: z.string().optional(),
    }),
    z.object({
        name: z.string().min(1, 'Step name is required'),
        type: z.literal(StepType.TRANSFORM),
        config: transformConfigSchema,
        nextStepId: z.string().optional(),
        onErrorStepId: z.string().optional(),
    }),
]);

// Trigger schema
const triggerSchema = z.object({
    type: z.nativeEnum(TriggerType),
    config: z.record(z.unknown()).optional(),
});

// Create workflow schema
export const createWorkflowSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(1, 'Workflow name is required')
            .max(100, 'Workflow name must be at most 100 characters'),
        description: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string().max(500).optional()
        ),
        trigger: triggerSchema,
        steps: z.array(workflowStepSchema).min(1, 'At least one step is required'),
    }),
});

// Update workflow schema
export const updateWorkflowSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Workflow ID is required'),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        trigger: triggerSchema.optional(),
        steps: z.array(workflowStepSchema).min(1).optional(),
        status: z.nativeEnum(WorkflowStatus).optional(),
    }),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>['body'];
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>['body'];
