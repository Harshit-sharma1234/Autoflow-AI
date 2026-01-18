import mongoose, { Document, Schema, Types } from 'mongoose';
import { LogLevel } from '@autoflow/shared';

export interface ILogDocument extends Document {
    runId: Types.ObjectId;
    stepId?: string;
    level: LogLevel;
    message: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

const logSchema = new Schema<ILogDocument>(
    {
        runId: {
            type: Schema.Types.ObjectId,
            ref: 'Run',
            required: true,
            index: true,
        },
        stepId: {
            type: String,
        },
        level: {
            type: String,
            enum: Object.values(LogLevel),
            required: true,
            default: LogLevel.INFO,
        },
        message: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        // Don't use timestamps since we have our own timestamp field
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

// TTL index to auto-delete old logs after 30 days
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Compound index for querying logs by run
logSchema.index({ runId: 1, timestamp: -1 });

export const Log = mongoose.model<ILogDocument>('Log', logSchema);
