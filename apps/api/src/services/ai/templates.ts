// Prompt template definitions
export interface PromptTemplate {
    name: string;
    description: string;
    systemPrompt: string;
    userPromptTemplate: string;
    schema: Record<string, unknown>;
}

// Template variable replacer
export const replaceTemplateVariables = (
    template: string,
    variables: Record<string, unknown>
): string => {
    // Match both simple keys like {{name}} and UUIDs like {{86996a49-360c-4f2b-accd-0ea1edcdbfff}}
    return template.replace(/\{\{([\w-]+)\}\}/g, (match, key) => {
        let value = variables[key];
        if (value === undefined) return match;

        // Check if value is a string that contains JSON, and parse it if so
        if (typeof value === 'string') {
            try {
                if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
                    value = JSON.parse(value);
                }
            } catch (e) {
                // Not valid JSON, keep as string
            }
        }

        // If it's an object (or was parsed into one), pretty print it
        if (typeof value === 'object' && value !== null) {
            // Check if it has a 'result' property (common AI wrapper)
            if ('result' in value && typeof (value as any).result === 'string') {
                try {
                    const innerJson = JSON.parse((value as any).result);
                    return JSON.stringify(innerJson, null, 2);
                } catch (e) {
                    // fall through
                }
            }
            return JSON.stringify(value, null, 2);
        }

        return String(value);
    });
};

// Pre-defined prompt templates
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
    // Extract structured data from text
    extractData: {
        name: 'extractData',
        description: 'Extract structured data from unstructured text',
        systemPrompt: `You are a data extraction assistant. Your job is to carefully analyze text and extract specific information in a structured JSON format. Be precise and only include information that is explicitly stated in the text.`,
        userPromptTemplate: `Extract the following fields from this text:
Fields to extract: {{fields}}

Text:
{{text}}

Respond with a JSON object containing the extracted data.`,
        schema: {
            type: 'object',
            additionalProperties: true,
        },
    },

    // Summarize content
    summarize: {
        name: 'summarize',
        description: 'Create a summary of the provided content',
        systemPrompt: `You are a summarization assistant. Create concise, accurate summaries that capture the key points of the provided content.`,
        userPromptTemplate: `Summarize the following content in {{style}} style:

{{content}}

Provide a summary that is approximately {{length}} words.`,
        schema: {
            type: 'object',
            properties: {
                summary: { type: 'string' },
                keyPoints: { type: 'array', items: { type: 'string' } },
                wordCount: { type: 'number' },
            },
            required: ['summary', 'keyPoints'],
        },
    },

    // Classify content
    classify: {
        name: 'classify',
        description: 'Classify content into predefined categories',
        systemPrompt: `You are a classification assistant. Analyze content and assign it to the most appropriate category from the provided options.`,
        userPromptTemplate: `Classify the following content into one of these categories: {{categories}}

Content:
{{content}}

Provide the classification with a confidence score.`,
        schema: {
            type: 'object',
            properties: {
                category: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                reasoning: { type: 'string' },
            },
            required: ['category', 'confidence'],
        },
    },

    // Analyze sentiment
    analyzeSentiment: {
        name: 'analyzeSentiment',
        description: 'Analyze the sentiment of text content',
        systemPrompt: `You are a sentiment analysis assistant. Analyze the emotional tone and sentiment of the provided text.`,
        userPromptTemplate: `Analyze the sentiment of the following text:

{{text}}`,
        schema: {
            type: 'object',
            properties: {
                sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
                score: { type: 'number', minimum: -1, maximum: 1 },
                emotions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            emotion: { type: 'string' },
                            intensity: { type: 'number', minimum: 0, maximum: 1 },
                        },
                    },
                },
            },
            required: ['sentiment', 'score'],
        },
    },

    // Generate response
    generateResponse: {
        name: 'generateResponse',
        description: 'Generate a response based on context and instructions',
        systemPrompt: `You are a professional assistant. Generate appropriate responses based on the provided context and instructions.`,
        userPromptTemplate: `{{instructions}}

Context:
{{context}}

Generate an appropriate response.`,
        schema: {
            type: 'object',
            properties: {
                response: { type: 'string' },
                tone: { type: 'string' },
                suggestions: { type: 'array', items: { type: 'string' } },
            },
            required: ['response'],
        },
    },
};

// Get a template by name
export const getTemplate = (name: string): PromptTemplate | undefined => {
    return PROMPT_TEMPLATES[name];
};

// Build prompt from template
export const buildPrompt = (
    templateName: string,
    variables: Record<string, unknown>
): { systemPrompt: string; userPrompt: string; schema: Record<string, unknown> } => {
    const template = getTemplate(templateName);

    if (!template) {
        throw new Error(`Template '${templateName}' not found`);
    }

    return {
        systemPrompt: template.systemPrompt,
        userPrompt: replaceTemplateVariables(template.userPromptTemplate, variables),
        schema: template.schema,
    };
};
