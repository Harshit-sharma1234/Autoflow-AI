import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AICompletionOptions, AICompletionResult, AIStructuredResult } from './types';
import config from '../../../config';
import { createLogger } from '../../../utils/logger';
import { AI_MODELS } from '@autoflow/shared';

const logger = createLogger('GeminiProvider');

export class GeminiProvider implements AIProvider {
    name: 'gemini' = 'gemini';
    private client: GoogleGenerativeAI;
    private defaultModel: string;

    constructor() {
        this.client = new GoogleGenerativeAI(config.ai.gemini.apiKey);
        // Use gemini-1.5-flash which is widely available
        this.defaultModel = 'gemini-2.0-flash';
    }

    async complete(
        prompt: string,
        systemPrompt?: string,
        options?: AICompletionOptions
    ): Promise<AICompletionResult> {
        const startTime = Date.now();
        const modelName = options?.model || this.defaultModel;

        const model = this.client.getGenerativeModel({ model: modelName });

        // Combine system prompt with user prompt
        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\n${prompt}`
            : prompt;

        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 2000,
                    topP: options?.topP ?? 1,
                },
            });

            const latencyMs = Date.now() - startTime;
            const response = result.response;
            const text = response.text();

            // Gemini doesn't return exact token counts in the same way
            // Estimate based on characters (rough approximation)
            const estimatedTokens = Math.ceil(text.length / 4);

            logger.debug({
                model: modelName,
                estimatedTokens,
                latencyMs,
            }, 'Gemini completion');

            return {
                content: text,
                tokensUsed: estimatedTokens,
                promptTokens: Math.ceil(fullPrompt.length / 4),
                completionTokens: estimatedTokens,
                model: modelName,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error, model: modelName }, 'Gemini completion failed');
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

        const model = this.client.getGenerativeModel({ model: modelName });

        const schemaPrompt = `${systemPrompt || ''}
You must respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Respond ONLY with the JSON object, no additional text or markdown code blocks.

User request: ${prompt}`;

        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: schemaPrompt }] }],
                generationConfig: {
                    temperature: options?.temperature ?? 0.3,
                    maxOutputTokens: options?.maxTokens ?? 2000,
                },
            });

            const latencyMs = Date.now() - startTime;
            const response = result.response;
            let text = response.text();

            // Clean up response (remove markdown code blocks if present)
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Parse JSON response
            let data: T;
            try {
                data = JSON.parse(text) as T;
            } catch (parseError) {
                logger.error({ text }, 'Failed to parse JSON response from Gemini');
                throw new Error('Invalid JSON response from AI');
            }

            const estimatedTokens = Math.ceil(text.length / 4);

            logger.debug({
                model: modelName,
                estimatedTokens,
                latencyMs,
            }, 'Gemini structured completion');

            return {
                data,
                tokensUsed: estimatedTokens,
                promptTokens: Math.ceil(schemaPrompt.length / 4),
                completionTokens: estimatedTokens,
                model: modelName,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error, model: modelName }, 'Gemini structured completion failed');
            throw error;
        }
    }
}
