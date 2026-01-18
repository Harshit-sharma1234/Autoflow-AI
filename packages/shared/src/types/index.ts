// ============================================
// User Types
// ============================================

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

export interface IUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserCreate {
    email: string;
    password: string;
    name: string;
}

export interface IUserLogin {
    email: string;
    password: string;
}

// ============================================
// Auth Types
// ============================================

export interface IAuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface IAuthResponse {
    user: IUser;
    tokens: IAuthTokens;
}

export interface ITokenPayload {
    userId: string;
    email: string;
    role: UserRole;
}

// ============================================
// Workflow Types
// ============================================

export enum WorkflowStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    PAUSED = 'paused',
    ARCHIVED = 'archived',
}

export enum TriggerType {
    MANUAL = 'manual',
    WEBHOOK = 'webhook',
    SCHEDULE = 'schedule',
}

export enum StepType {
    AI_PROCESS = 'ai_process',
    EMAIL = 'email',
    WEBHOOK = 'webhook',
    SAVE_DATA = 'save_data',
    CONDITION = 'condition',
    TRANSFORM = 'transform',
}

export interface IWorkflowTrigger {
    type: TriggerType;
    config: Record<string, unknown>;
}

export interface IWorkflowStep {
    id: string;
    name: string;
    type: StepType;
    config: Record<string, unknown>;
    nextStepId?: string;
    onErrorStepId?: string;
}

export interface IWorkflow {
    id: string;
    userId: string;
    name: string;
    description?: string;
    trigger: IWorkflowTrigger;
    steps: IWorkflowStep[];
    status: WorkflowStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWorkflowCreate {
    name: string;
    description?: string;
    trigger: IWorkflowTrigger;
    steps: Omit<IWorkflowStep, 'id'>[];
}

// ============================================
// Run Types
// ============================================

export enum RunStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export interface IRun {
    id: string;
    workflowId: string;
    userId: string;
    status: RunStatus;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    currentStepId?: string;
    startedAt: Date;
    completedAt?: Date;
}

export interface IRunCreate {
    workflowId: string;
    input: Record<string, unknown>;
}

// ============================================
// Log Types
// ============================================

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

export interface ILog {
    id: string;
    runId: string;
    stepId?: string;
    level: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

// ============================================
// AI Output Types
// ============================================

export interface IAIOutput {
    id: string;
    runId: string;
    stepId: string;
    model: string;
    provider: 'openai' | 'gemini';
    prompt: string;
    response: Record<string, unknown>;
    tokensUsed: number;
    latencyMs: number;
    createdAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface IApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

export interface IPaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// ============================================
// Job Types (for BullMQ)
// ============================================

export enum JobType {
    DOCUMENT_PROCESS = 'document_process',
    AI_PROCESS = 'ai_process',
    ACTION_EXECUTE = 'action_execute',
}

export interface IDocumentJob {
    runId: string;
    fileUrl: string;
    fileType: string;
}

export interface IAIJob {
    runId: string;
    stepId: string;
    prompt: string;
    schema?: Record<string, unknown>;
    model?: string;
}

export interface IActionJob {
    runId: string;
    stepId: string;
    actionType: StepType;
    config: Record<string, unknown>;
    data: Record<string, unknown>;
}
