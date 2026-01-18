import { AIProvider, AICompletionOptions, AIStructuredResult } from './providers/types';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { AIOutput } from '../../models/aiOutput.model';
import { createLogger } from '../../utils/logger';
import config from '../../config';

const logger = createLogger('AIService');

type ProviderName = 'openai' | 'gemini' | 'groq';

export class AIService {
    private providers: Map<ProviderName, AIProvider>;
    private defaultProvider: ProviderName;

    constructor() {
        this.providers = new Map();

        // Initialize Groq provider if key is configured (preferred - free tier)
        if (config.ai.groq.apiKey) {
            this.providers.set('groq', new GroqProvider());
        }

        // Initialize OpenAI provider if key is configured
        if (config.ai.openai.apiKey) {
            this.providers.set('openai', new OpenAIProvider());
        }

        // Initialize Gemini provider if key is configured
        if (config.ai.gemini.apiKey) {
            this.providers.set('gemini', new GeminiProvider());
        }

        // Set default provider (prefer Groq > Gemini > OpenAI)
        if (config.ai.groq.apiKey) {
            this.defaultProvider = 'groq';
        } else if (config.ai.gemini.apiKey) {
            this.defaultProvider = 'gemini';
        } else {
            this.defaultProvider = 'openai';
        }

        if (this.providers.size === 0) {
            logger.warn('No AI providers configured');
        } else {
            logger.info({ defaultProvider: this.defaultProvider }, 'AI service initialized');
        }
    }

    // Get a specific provider
    getProvider(name?: ProviderName): AIProvider {
        const providerName = name || this.defaultProvider;
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new Error(`AI provider '${providerName}' not configured`);
        }

        return provider;
    }

    // Process with structured output and save to database
    async processWithSchema<T>(
        runId: string,
        stepId: string,
        prompt: string,
        schema: Record<string, unknown>,
        options?: AICompletionOptions & { provider?: ProviderName; systemPrompt?: string }
    ): Promise<T> {
        const provider = this.getProvider(options?.provider);

        // Retry logic
        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await provider.completeWithSchema<T>(
                    prompt,
                    schema,
                    options?.systemPrompt,
                    options
                );

                // Save AI output to database
                await AIOutput.create({
                    runId,
                    stepId,
                    model: result.model,
                    provider: provider.name,
                    prompt,
                    response: result.data,
                    tokensUsed: result.tokensUsed,
                    promptTokens: result.promptTokens,
                    completionTokens: result.completionTokens,
                    latencyMs: result.latencyMs,
                });

                logger.info({
                    runId,
                    stepId,
                    provider: provider.name,
                    model: result.model,
                    tokensUsed: result.tokensUsed,
                    latencyMs: result.latencyMs,
                    attempt,
                }, 'AI processing completed');

                return result.data;
            } catch (error) {
                lastError = error as Error;
                const errorMessage = lastError.message || '';

                // Don't retry on quota/rate limit errors - fail immediately
                const isQuotaError = errorMessage.includes('429') ||
                    errorMessage.includes('quota') ||
                    errorMessage.includes('rate limit') ||
                    errorMessage.includes('Too Many Requests');

                if (isQuotaError) {
                    logger.error({
                        runId,
                        stepId,
                        error: errorMessage,
                    }, 'AI quota/rate limit exceeded - not retrying');
                    throw lastError;
                }

                logger.warn({
                    runId,
                    stepId,
                    attempt,
                    maxRetries,
                    error: lastError.message,
                }, 'AI processing attempt failed');

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('AI processing failed');
    }

    // Simple completion (no schema)
    async complete(
        prompt: string,
        options?: AICompletionOptions & { provider?: ProviderName; systemPrompt?: string }
    ): Promise<string> {
        const provider = this.getProvider(options?.provider);
        const result = await provider.complete(prompt, options?.systemPrompt, options);
        return result.content;
    }
}

// Singleton instance
export const aiService = new AIService();
