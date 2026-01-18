// AI Provider Interface
export interface AICompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}

export interface AICompletionResult {
    content: string;
    tokensUsed: number;
    promptTokens: number;
    completionTokens: number;
    model: string;
    latencyMs: number;
}

export interface AIStructuredResult<T> {
    data: T;
    tokensUsed: number;
    promptTokens: number;
    completionTokens: number;
    model: string;
    latencyMs: number;
}

export interface AIProvider {
    name: 'openai' | 'gemini' | 'groq';

    complete(
        prompt: string,
        systemPrompt?: string,
        options?: AICompletionOptions
    ): Promise<AICompletionResult>;

    completeWithSchema<T>(
        prompt: string,
        schema: Record<string, unknown>,
        systemPrompt?: string,
        options?: AICompletionOptions
    ): Promise<AIStructuredResult<T>>;
}
