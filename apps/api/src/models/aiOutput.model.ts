import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAIOutputDocument extends Document {
    runId: Types.ObjectId;
    stepId: string;
    model: string;
    provider: 'openai' | 'gemini' | 'groq';
    prompt: string;
    response: Record<string, unknown>;
    tokensUsed: number;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs: number;
    cost?: number;
    createdAt: Date;
}

const aiOutputSchema = new Schema<IAIOutputDocument>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: 'Run',
            required: true,
            index: true,
        },
        stepId: {
            type: String,
            required: true,
        },
        model: {
            type: String,
            required: true,
        },
        provider: {
            type: String,
            enum: ['openai', 'gemini', 'groq'],
            required: true,
        },
        prompt: {
            type: String,
            required: true,
        },
        response: {
            type: Schema.Types.Mixed,
            required: true,
        },
        tokensUsed: {
            type: Number,
            required: true,
            default: 0,
        },
        promptTokens: {
            type: Number,
        },
        completionTokens: {
            type: Number,
        },
        latencyMs: {
            type: Number,
            required: true,
        },
        cost: {
            type: Number,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Indexes
aiOutputSchema.index({ runId: 1, createdAt: -1 });
aiOutputSchema.index({ provider: 1, model: 1 });

export const AIOutput = mongoose.model<IAIOutputDocument>('AIOutput', aiOutputSchema);
