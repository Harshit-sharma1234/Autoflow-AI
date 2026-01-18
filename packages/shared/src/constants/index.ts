// API Routes
export const API_ROUTES = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
    },
    USERS: {
        BASE: '/users',
        BY_ID: (id: string) => `/users/${id}`,
    },
    WORKFLOWS: {
        BASE: '/workflows',
        BY_ID: (id: string) => `/workflows/${id}`,
        TRIGGER: (id: string) => `/workflows/${id}/trigger`,
    },
    RUNS: {
        BASE: '/runs',
        BY_ID: (id: string) => `/runs/${id}`,
        LOGS: (id: string) => `/runs/${id}/logs`,
        CANCEL: (id: string) => `/runs/${id}/cancel`,
    },
    FILES: {
        UPLOAD: '/files/upload',
        BY_ID: (id: string) => `/files/${id}`,
    },
} as const;

// Queue Names
export const QUEUE_NAMES = {
    DOCUMENT_PROCESSING: 'document-processing',
    AI_PROCESSING: 'ai-processing',
    ACTION_EXECUTION: 'action-execution',
} as const;

// Job Priorities
export const JOB_PRIORITIES = {
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
} as const;

// Rate Limits
export const RATE_LIMITS = {
    AUTH: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100, // Increased for development
    },
    API: {
        WINDOW_MS: 60 * 1000, // 1 minute
        MAX_REQUESTS: 100,
    },
} as const;

// Token Expiry
export const TOKEN_EXPIRY = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
} as const;

// Pagination Defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

// AI Models
export const AI_MODELS = {
    OPENAI: {
        GPT4: 'gpt-4o-mini',
        GPT35: 'gpt-3.5-turbo',
    },
    GEMINI: {
        PRO: 'gemini-1.5-flash',
        PRO_VISION: 'gemini-1.5-pro',
    },
} as const;

// File Upload
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'text/plain', 'text/markdown'],
    ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.md'],
} as const;
