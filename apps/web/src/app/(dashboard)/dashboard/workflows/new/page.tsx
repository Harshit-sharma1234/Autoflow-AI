'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Clock, Zap, Webhook, Settings, FileText } from 'lucide-react';
import { api, handleApiError } from '@/lib/api';

interface Step {
    id: string;
    name: string;
    type: 'ai_process' | 'email' | 'webhook' | 'save_data' | 'condition' | 'transform';
    config: Record<string, unknown>;
}

const triggerTypes = [
    { value: 'manual', label: 'Manual Trigger', icon: Zap, description: 'Run manually from dashboard' },
    { value: 'schedule', label: 'Scheduled', icon: Clock, description: 'Run on a schedule' },
    { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger via HTTP webhook' },
    { value: 'file_upload', label: 'File Upload', icon: FileText, description: 'Trigger when a file is uploaded' },
];

const stepTypes = [
    { value: 'ai_process', label: 'AI Process', description: 'Process data using AI', requiresPrompt: true },
    { value: 'email', label: 'Send Email', description: 'Send an email notification', requiresPrompt: false },
    { value: 'webhook', label: 'Call Webhook', description: 'Make HTTP request to external service', requiresPrompt: false },
    { value: 'save_data', label: 'Save Data', description: 'Save data to collection', requiresPrompt: false },
    { value: 'transform', label: 'Transform Data', description: 'Transform and format data', requiresPrompt: false },
];

export default function NewWorkflowPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('manual');
    const [steps, setSteps] = useState<Step[]>([]);
    const [showStepModal, setShowStepModal] = useState(false);
    const [editingStep, setEditingStep] = useState<Step | null>(null);

    const addStep = (type: Step['type']) => {
        const stepInfo = stepTypes.find(s => s.value === type);
        const newStep: Step = {
            id: crypto.randomUUID(),
            name: stepInfo?.label || type,
            type,
            config: stepInfo?.requiresPrompt ? { prompt: '' } : {},
        };
        setSteps([...steps, newStep]);
        setEditingStep(newStep);
        setShowStepModal(false);
    };

    const updateStep = (id: string, updates: Partial<Step>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
        if (editingStep?.id === id) setEditingStep(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (loading) {
            return;
        }

        if (!name.trim()) {
            setError('Workflow name is required');
            return;
        }

        if (steps.length === 0) {
            setError('Add at least one step to the workflow');
            return;
        }

        // Validate all steps have required fields
        for (const step of steps) {
            if (!step.name.trim()) {
                setError(`Step ${steps.indexOf(step) + 1} requires a name`);
                return;
            }

            switch (step.type) {
                case 'ai_process':
                    if (!step.config.prompt || !(step.config.prompt as string).trim()) {
                        setError(`Step "${step.name}" requires a prompt`);
                        return;
                    }
                    break;
                case 'email':
                    if (!step.config.to || !(step.config.to as string).trim()) {
                        setError(`Step "${step.name}" requires a recipient email`);
                        return;
                    }
                    if (!step.config.subject || !(step.config.subject as string).trim()) {
                        setError(`Step "${step.name}" requires an email subject`);
                        return;
                    }
                    break;
                case 'webhook':
                    if (!step.config.url || !(step.config.url as string).trim()) {
                        setError(`Step "${step.name}" requires a webhook URL`);
                        return;
                    }
                    break;
                case 'save_data':
                    if (!step.config.collection || !(step.config.collection as string).trim()) {
                        setError(`Step "${step.name}" requires a collection name`);
                        return;
                    }
                    break;
                case 'condition':
                    if (!step.config.expression || !(step.config.expression as string).trim()) {
                        setError(`Step "${step.name}" requires a condition expression`);
                        return;
                    }
                    break;
            }
        }

        try {
            setLoading(true);
            setError(null);

            const payload = {
                name,
                description: description || undefined,
                trigger: { type: triggerType, config: {} },
                steps: steps.map(s => ({
                    name: s.name,
                    type: s.type,
                    config: s.config,
                })),
            };

            console.log('Submitting workflow:', payload);

            const response = await api.post('/v1/workflows', payload);
            console.log('Workflow created successfully:', response.data);

            // Use replace instead of push to prevent back button issues
            router.replace('/dashboard/workflows');
        } catch (err) {
            console.error('Error creating workflow:', err);
            const errorMessage = handleApiError(err);
            console.error('Error message:', errorMessage);
            setError(errorMessage);
            // Don't redirect on error - stay on the page to show the error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/workflows" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Create Workflow</h1>
                    <p className="text-slate-600 dark:text-slate-400">Build a new automation workflow</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-semibold">Basic Information</h2>

                    <div>
                        <label className="block text-sm font-medium mb-1">Workflow Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="e.g., Invoice Processing"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            rows={3}
                            placeholder="What does this workflow do?"
                        />
                    </div>
                </div>

                {/* Trigger */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-semibold">Trigger</h2>
                    <p className="text-sm text-slate-500">How should this workflow be started?</p>

                    <div className="grid grid-cols-3 gap-3">
                        {triggerTypes.map((trigger) => (
                            <button
                                key={trigger.value}
                                type="button"
                                onClick={() => setTriggerType(trigger.value)}
                                className={`p-4 border rounded-lg text-left transition-all ${triggerType === trigger.value
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <trigger.icon className={`h-5 w-5 ${triggerType === trigger.value ? 'text-primary-500' : 'text-slate-400'}`} />
                                    <div>
                                        <div className="font-medium">{trigger.label}</div>
                                        <div className="text-xs text-slate-500">{trigger.description}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Steps */}
                <div className="card space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold">Steps</h2>
                            <p className="text-sm text-slate-500">Steps that run when the workflow is triggered</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowStepModal(true)}
                            className="btn-secondary"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Step
                        </button>
                    </div>

                    {steps.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                            <p className="text-slate-500 mb-2">No steps added yet</p>
                            <button
                                type="button"
                                onClick={() => setShowStepModal(true)}
                                className="text-primary-500 hover:text-primary-600 font-medium"
                            >
                                Add your first step
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={step.id} className={`p-4 rounded-lg border ${editingStep?.id === step.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'bg-slate-50 dark:bg-slate-800 border-transparent'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-medium text-primary-600">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={step.name}
                                                onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                                className="font-medium bg-transparent border-none p-0 focus:ring-0 w-full"
                                                placeholder="Step name"
                                            />
                                            <span className="text-xs text-slate-500">{stepTypes.find(s => s.value === step.type)?.label}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingStep(editingStep?.id === step.id ? null : step)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                        >
                                            <Settings className="h-4 w-4 text-slate-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeStep(step.id)}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </button>
                                    </div>

                                    {/* Step Configuration */}
                                    {editingStep?.id === step.id && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                            {step.type === 'ai_process' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Prompt *</label>
                                                    <textarea
                                                        value={(step.config.prompt as string) || ''}
                                                        onChange={(e) => updateStep(step.id, { config: { ...step.config, prompt: e.target.value } })}
                                                        className="input-field"
                                                        rows={3}
                                                        placeholder="Enter the AI prompt. Use {{variable}} for dynamic data."
                                                    />
                                                </div>
                                            )}
                                            {step.type === 'email' && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">To Email *</label>
                                                        <input
                                                            type="text"
                                                            value={(step.config.to as string) || ''}
                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, to: e.target.value } })}
                                                            className="input-field"
                                                            placeholder="email@example.com or {{user.email}}"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Subject *</label>
                                                        <input
                                                            type="text"
                                                            value={(step.config.subject as string) || ''}
                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, subject: e.target.value } })}
                                                            className="input-field"
                                                            placeholder="Email subject"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Body</label>
                                                        <textarea
                                                            value={(step.config.body as string) || ''}
                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, body: e.target.value } })}
                                                            className="input-field"
                                                            rows={3}
                                                            placeholder="Email body"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            {step.type === 'webhook' && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">URL *</label>
                                                        <input
                                                            type="url"
                                                            value={(step.config.url as string) || ''}
                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, url: e.target.value } })}
                                                            className="input-field"
                                                            placeholder="https://api.example.com/webhook"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Method</label>
                                                        <select
                                                            value={(step.config.method as string) || 'POST'}
                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, method: e.target.value } })}
                                                            className="input-field"
                                                        >
                                                            <option value="GET">GET</option>
                                                            <option value="POST">POST</option>
                                                            <option value="PUT">PUT</option>
                                                            <option value="PATCH">PATCH</option>
                                                            <option value="DELETE">DELETE</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}
                                            {step.type === 'save_data' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Collection Name *</label>
                                                    <input
                                                        type="text"
                                                        value={(step.config.collection as string) || ''}
                                                        onChange={(e) => updateStep(step.id, { config: { ...step.config, collection: e.target.value, mapping: {} } })}
                                                        className="input-field"
                                                        placeholder="e.g., processed_invoices"
                                                    />
                                                </div>
                                            )}
                                            {step.type === 'transform' && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-1">Transform Expression</label>
                                                    <textarea
                                                        value={(step.config.expression as string) || ''}
                                                        onChange={(e) => updateStep(step.id, { config: { ...step.config, expression: e.target.value } })}
                                                        className="input-field font-mono text-sm"
                                                        rows={3}
                                                        placeholder="// JavaScript expression"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1"
                    >
                        {loading ? 'Creating...' : 'Create Workflow'}
                    </button>
                    <Link href="/dashboard/workflows" className="btn-secondary">
                        Cancel
                    </Link>
                </div>
            </form>

            {/* Step Type Modal */}
            {showStepModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Add Step</h3>
                            <button
                                onClick={() => setShowStepModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {stepTypes.map((stepType) => (
                                <button
                                    key={stepType.value}
                                    onClick={() => addStep(stepType.value as Step['type'])}
                                    className="w-full p-4 text-left border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                >
                                    <div className="font-medium">{stepType.label}</div>
                                    <div className="text-sm text-slate-500">{stepType.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
