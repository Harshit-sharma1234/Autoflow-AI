import mongoose, { Document, Schema, Types } from 'mongoose';
import { WorkflowStatus, TriggerType, StepType, IWorkflowStep, IWorkflowTrigger } from '@autoflow/shared';

export interface IWorkflowDocument extends Document {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    trigger: IWorkflowTrigger;
    steps: IWorkflowStep[];
    status: WorkflowStatus;
    createdAt: Date;
    updatedAt: Date;
}

const workflowStepSchema = new Schema<IWorkflowStep>(
    {
        id: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: Object.values(StepType),
            required: true,
        },
        config: {
            type: Schema.Types.Mixed,
            required: true,
        },
        nextStepId: String,
        onErrorStepId: String,
    },
    { _id: false }
);

const triggerSchema = new Schema<IWorkflowTrigger>(
    {
        type: {
            type: String,
            enum: Object.values(TriggerType),
            required: true,
        },
        config: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    { _id: false }
);

const workflowSchema = new Schema<IWorkflowDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Workflow name is required'],
            trim: true,
            maxlength: [100, 'Workflow name must be at most 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description must be at most 500 characters'],
        },
        trigger: {
            type: triggerSchema,
            required: true,
        },
        steps: {
            type: [workflowStepSchema],
            required: true,
            validate: {
                validator: (steps: IWorkflowStep[]) => steps.length > 0,
                message: 'At least one step is required',
            },
        },
        status: {
            type: String,
            enum: Object.values(WorkflowStatus),
            default: WorkflowStatus.DRAFT,
        },
    },
    {
        timestamps: true,
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

// Compound indexes
workflowSchema.index({ userId: 1, status: 1 });
workflowSchema.index({ userId: 1, createdAt: -1 });

export const Workflow = mongoose.model<IWorkflowDocument>('Workflow', workflowSchema);
