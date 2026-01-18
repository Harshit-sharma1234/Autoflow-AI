'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IUser, IAuthTokens } from '@autoflow/shared';
import { api, setAuthToken } from '@/lib/api';

interface AuthContextType {
    user: IUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'autoflow_tokens';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load tokens from storage
    const loadTokens = (): IAuthTokens | null => {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(TOKEN_KEY);
        return stored ? JSON.parse(stored) : null;
    };

    // Save tokens to storage
    const saveTokens = (tokens: IAuthTokens) => {
        localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
        setAuthToken(tokens.accessToken);
    };

    // Clear tokens
    const clearTokens = () => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
    };

    // Fetch current user
    const fetchUser = useCallback(async () => {
        try {
            const tokens = loadTokens();
            if (!tokens) {
                setIsLoading(false);
                return;
            }

            setAuthToken(tokens.accessToken);
            const response = await api.get('/v1/auth/me');
            setUser(response.data.data.user);
        } catch (error) {
            clearTokens();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initialize auth
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Login
    const login = async (email: string, password: string) => {
        const response = await api.post('/v1/auth/login', { email, password });
        const { user, tokens } = response.data.data;
        saveTokens(tokens);
        setUser(user);
        router.push('/dashboard');
    };

    // Register
    const register = async (email: string, password: string, name: string) => {
        const response = await api.post('/v1/auth/register', { email, password, name });
        const { user, tokens } = response.data.data;
        saveTokens(tokens);
        setUser(user);
        router.push('/dashboard');
    };

    // Logout
    const logout = async () => {
        try {
            const tokens = loadTokens();
            if (tokens) {
                await api.post('/v1/auth/logout', { refreshToken: tokens.refreshToken });
            }
        } catch (error) {
            // Ignore errors
        } finally {
            clearTokens();
            setUser(null);
            router.push('/login');
        }
    };

    // Refresh auth
    const refreshAuth = async () => {
        const tokens = loadTokens();
        if (!tokens?.refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await api.post('/v1/auth/refresh', {
            refreshToken: tokens.refreshToken,
        });
        saveTokens(response.data.data.tokens);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
