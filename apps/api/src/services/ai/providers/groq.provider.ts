import Groq from 'groq-sdk';
import { AIProvider, AICompletionOptions, AICompletionResult, AIStructuredResult } from './types';
import config from '../../../config';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('GroqProvider');

export class GroqProvider implements AIProvider {
    name: 'groq' = 'groq';
    private client: Groq;
    private defaultModel: string;

    constructor() {
        this.client = new Groq({
            apiKey: config.ai.groq.apiKey,
        });
        // Use llama-3.3-70b-versatile - fast and capable
        this.defaultModel = 'llama-3.3-70b-versatile';
    }

    async complete(
        prompt: string,
        systemPrompt?: string,
        options?: AICompletionOptions
    ): Promise<AICompletionResult> {
        const startTime = Date.now();
        const modelName = options?.model || this.defaultModel;

        try {
            const messages: { role: 'system' | 'user'; content: string }[] = [];

            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });

            const response = await this.client.chat.completions.create({
                model: modelName,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 2000,
            });

            const latencyMs = Date.now() - startTime;
            const content = response.choices[0]?.message?.content || '';
            const usage = response.usage;

            logger.debug({
                model: modelName,
                tokensUsed: usage?.total_tokens,
                latencyMs,
            }, 'Groq completion');

            return {
                content,
                tokensUsed: usage?.total_tokens || 0,
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                model: modelName,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error, model: modelName }, 'Groq completion failed');
            throw error;
        }
    }

    async completeWithSchema<T>(
        prompt: string,
        schema: Record<string, unknown>,
        systemPrompt?: string,
        options?: AICompletionOptions
    ): Promise<AIStructuredResult<T>> {
        const startTime = Date.now();
        const modelName = options?.model || this.defaultModel;

        const schemaPrompt = `${systemPrompt || ''}
You must respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Respond ONLY with the JSON object, no additional text or markdown code blocks.

User request: ${prompt}`;

        try {
            const response = await this.client.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: schemaPrompt }],
                temperature: options?.temperature ?? 0.3,
                max_tokens: options?.maxTokens ?? 2000,
            });

            const latencyMs = Date.now() - startTime;
            let text = response.choices[0]?.message?.content || '';
            const usage = response.usage;

            // Clean up response (remove markdown code blocks if present)
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Parse JSON response
            let data: T;
            try {
                data = JSON.parse(text) as T;
            } catch (parseError) {
                logger.error({ text }, 'Failed to parse JSON response from Groq');
                throw new Error('Invalid JSON response from AI');
            }

            logger.debug({
                model: modelName,
                tokensUsed: usage?.total_tokens,
                latencyMs,
            }, 'Groq structured completion');

            return {
                data,
                tokensUsed: usage?.total_tokens || 0,
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                model: modelName,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error, model: modelName }, 'Groq structured completion failed');
            throw error;
        }
    }
}
