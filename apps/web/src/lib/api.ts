import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Token management
let accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    accessToken = token;
};

// Request interceptor
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const storedTokens = localStorage.getItem('autoflow_tokens');
                if (storedTokens) {
                    const tokens = JSON.parse(storedTokens);
                    const response = await axios.post(`${API_URL}/v1/auth/refresh`, {
                        refreshToken: tokens.refreshToken,
                    });

                    const newTokens = response.data.data.tokens;
                    localStorage.setItem('autoflow_tokens', JSON.stringify(newTokens));
                    setAuthToken(newTokens.accessToken);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                    }
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('autoflow_tokens');
                setAuthToken(null);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// File upload helper
export const uploadFile = async (file: File): Promise<{ id: string; path: string; originalName: string; mimeType: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/v1/files/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
    });

    return response.data.data;
};

// Helper functions
export const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const errorData = error.response?.data?.error;
        if (errorData) {
            // If there are validation details, format them nicely
            if (errorData.details && Array.isArray(errorData.details)) {
                const details = errorData.details as Array<{ path?: string; message: string }>;
                if (details.length > 0) {
                    const formattedErrors = details
                        .map((d) => {
                            const field = d.path ? `"${d.path}"` : 'field';
                            return `${field}: ${d.message}`;
                        })
                        .join('; ');
                    return `${errorData.message || 'Validation failed'}: ${formattedErrors}`;
                }
            }
            return errorData.message || error.message;
        }
        return error.message || 'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
};
