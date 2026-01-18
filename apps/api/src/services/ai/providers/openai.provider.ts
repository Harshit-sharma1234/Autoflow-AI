import OpenAI from 'openai';
import { AIProvider, AICompletionOptions, AICompletionResult, AIStructuredResult } from './types';
import config from '../../../config';
import { createLogger } from '../../../utils/logger';
import { AI_MODELS } from '@autoflow/shared';

const logger = createLogger('OpenAIProvider');

export class OpenAIProvider implements AIProvider {
    name: 'openai' = 'openai';
    private client: OpenAI;
    private defaultModel: string;

    constructor() {
        this.client = new OpenAI({
            apiKey: config.ai.openai.apiKey,
        });
        this.defaultModel = AI_MODELS.OPENAI.GPT4;
    }

    async complete(
        prompt: string,
        systemPrompt?: string,
        options?: AICompletionOptions
    ): Promise<AICompletionResult> {
        const startTime = Date.now();
        const model = options?.model || this.defaultModel;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        try {
            const response = await this.client.chat.completions.create({
                model,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 2000,
                top_p: options?.topP ?? 1,
            });

            const latencyMs = Date.now() - startTime;
            const choice = response.choices[0];
            const usage = response.usage;

            logger.debug({
                model,
                promptTokens: usage?.prompt_tokens,
                completionTokens: usage?.completion_tokens,
                latencyMs,
            }, 'OpenAI completion');

            return {
                content: choice?.message?.content || '',
                tokensUsed: usage?.total_tokens || 0,
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                model,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error, model }, 'OpenAI completion failed');
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
        const model = options?.model || this.defaultModel;

        const schemaSystemPrompt = `${systemPrompt || ''}
You must respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Respond ONLY with the JSON object, no additional text.`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: schemaSystemPrompt },
            { role: 'user', content: prompt },
        ];

        try {
            const response = await this.client.chat.completions.create({
                model,
                messages,
                temperature: options?.temperature ?? 0.3, // Lower temp for structured output
                max_tokens: options?.maxTokens ?? 2000,
                response_format: { type: 'json_object' },
            });

            const latencyMs = Date.now() - startTime;
            const choice = response.choices[0];
            const usage = response.usage;
            const content = choice?.message?.content || '{}';

            // Parse JSON response
            let data: T;
            try {
                data = JSON.parse(content) as T;
            } catch (parseError) {
                logger.error({ content }, 'Failed to parse JSON response');
                throw new Error('Invalid JSON response from AI');
            }

            logger.debug({
                model,
                promptTokens: usage?.prompt_tokens,
                completionTokens: usage?.completion_tokens,
                latencyMs,
            }, 'OpenAI structured completion');

            return {
                data,
                tokensUsed: usage?.total_tokens || 0,
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                model,
                latencyMs,
            };
        } catch (error) {
            logger.error({ error, model }, 'OpenAI structured completion failed');
            throw error;
        }
    }
}
