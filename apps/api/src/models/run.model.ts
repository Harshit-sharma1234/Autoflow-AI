import mongoose, { Document, Schema, Types } from 'mongoose';
import { RunStatus } from '@autoflow/shared';

export interface IRunDocument extends Document {
    workflowId: Types.ObjectId;
    userId: Types.ObjectId;
    status: RunStatus;
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    currentStepId?: string;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const runSchema = new Schema<IRunDocument>(
    {
        workflowId: {
            type: Schema.Types.ObjectId,
            ref: 'Workflow',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(RunStatus),
            default: RunStatus.PENDING,
            index: true,
        },
        input: {
            type: Schema.Types.Mixed,
            required: true,
            default: {},
        },
        output: {
            type: Schema.Types.Mixed,
        },
        error: {
            type: String,
        },
        currentStepId: {
            type: String,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete (ret as any)._id;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// Indexes for common queries
runSchema.index({ userId: 1, createdAt: -1 });
runSchema.index({ workflowId: 1, createdAt: -1 });
runSchema.index({ status: 1, createdAt: -1 });

export const Run = mongoose.model<IRunDocument>('Run', runSchema);
