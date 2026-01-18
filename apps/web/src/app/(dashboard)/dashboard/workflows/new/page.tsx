'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, ArrowRight, Plus, Trash2, Clock, Zap, Webhook, FileText,
    Brain, Mail, Database, Sparkles, Check, ChevronDown, ChevronUp, GripVertical,
    Play, AlertCircle, FileUp
} from 'lucide-react';
import { api, handleApiError } from '@/lib/api';

interface Step {
    id: string;
    name: string;
    type: 'ai_process' | 'email' | 'webhook' | 'save_data' | 'condition' | 'transform' | 'document_process';
    config: Record<string, unknown>;
    isExpanded?: boolean;
}

const triggerTypes = [
    { value: 'manual', label: 'Manual Trigger', icon: Zap, description: 'Run manually from dashboard', color: 'from-blue-500 to-cyan-500' },
    { value: 'schedule', label: 'Scheduled', icon: Clock, description: 'Run on a schedule', color: 'from-purple-500 to-pink-500' },
    { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger via HTTP webhook', color: 'from-orange-500 to-red-500' },
    { value: 'file_upload', label: 'File Upload', icon: FileText, description: 'Trigger when a file is uploaded', color: 'from-green-500 to-emerald-500' },
];

const stepTypes = [
    { value: 'document_process', label: 'Document Process', description: 'Extract text from PDF/images', icon: FileUp, color: 'from-blue-500 to-cyan-500', requiresPrompt: false },
    { value: 'ai_process', label: 'AI Process', description: 'Process data using AI', icon: Brain, color: 'from-violet-500 to-purple-500', requiresPrompt: true },
    { value: 'email', label: 'Send Email', description: 'Send an email notification', icon: Mail, color: 'from-pink-500 to-rose-500', requiresPrompt: false },
    { value: 'webhook', label: 'Call Webhook', description: 'Make HTTP request', icon: Webhook, color: 'from-amber-500 to-orange-500', requiresPrompt: false },
    { value: 'save_data', label: 'Save Data', description: 'Save to database', icon: Database, color: 'from-teal-500 to-green-500', requiresPrompt: false },
];

const wizardSteps = [
    { id: 1, label: 'Basic Info', description: 'Name & trigger' },
    { id: 2, label: 'Build Flow', description: 'Add workflow steps' },
    { id: 3, label: 'Review', description: 'Confirm & create' },
];

export default function NewWorkflowPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentWizardStep, setCurrentWizardStep] = useState(1);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('manual');
    const [steps, setSteps] = useState<Step[]>([]);
    const [showStepModal, setShowStepModal] = useState(false);

    const addStep = (type: Step['type']) => {
        const stepInfo = stepTypes.find(s => s.value === type);
        const newStep: Step = {
            id: crypto.randomUUID(),
            name: stepInfo?.label || type,
            type,
            config: stepInfo?.requiresPrompt ? { prompt: '' } : {},
            isExpanded: true,
        };
        setSteps([...steps, newStep]);
        setShowStepModal(false);
    };

    const updateStep = (id: string, updates: Partial<Step>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const toggleStepExpanded = (id: string) => {
        setSteps(steps.map(s => s.id === id ? { ...s, isExpanded: !s.isExpanded } : s));
    };

    const canProceedToNext = () => {
        if (currentWizardStep === 1) return name.trim().length > 0;
        if (currentWizardStep === 2) return steps.length > 0;
        return true;
    };

    const validateSteps = (): string | null => {
        for (const step of steps) {
            if (!step.name.trim()) return `Step ${steps.indexOf(step) + 1} requires a name`;

            switch (step.type) {
                case 'ai_process':
                    if (!step.config.prompt || !(step.config.prompt as string).trim()) {
                        return `Step "${step.name}" requires a prompt`;
                    }
                    break;
                case 'email':
                    if (!step.config.to || !(step.config.to as string).trim()) {
                        return `Step "${step.name}" requires a recipient email`;
                    }
                    if (!step.config.subject || !(step.config.subject as string).trim()) {
                        return `Step "${step.name}" requires an email subject`;
                    }
                    break;
                case 'webhook':
                    if (!step.config.url || !(step.config.url as string).trim()) {
                        return `Step "${step.name}" requires a webhook URL`;
                    }
                    break;
                case 'save_data':
                    if (!step.config.collection || !(step.config.collection as string).trim()) {
                        return `Step "${step.name}" requires a collection name`;
                    }
                    break;
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        if (loading) return;

        const validationError = validateSteps();
        if (validationError) {
            setError(validationError);
            return;
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

            await api.post('/v1/workflows', payload);
            router.replace('/dashboard/workflows');
        } catch (err) {
            console.error('Error creating workflow:', err);
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const getStepIcon = (type: string) => {
        const stepType = stepTypes.find(s => s.value === type);
        return stepType?.icon || Brain;
    };

    const getStepColor = (type: string) => {
        const stepType = stepTypes.find(s => s.value === type);
        return stepType?.color || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="min-h-screen">
            {/* Header with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E\")" }}></div>

                <div className="relative max-w-5xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/dashboard/workflows" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Sparkles className="h-8 w-8 text-primary-400" />
                                Create Workflow
                            </h1>
                            <p className="text-slate-400 mt-1">Build powerful automations in minutes</p>
                        </div>
                    </div>

                    {/* Wizard Progress */}
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {wizardSteps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${currentWizardStep > step.id
                                            ? 'wizard-step-completed'
                                            : currentWizardStep === step.id
                                                ? 'wizard-step-active'
                                                : 'wizard-step-pending'
                                            }`}
                                    >
                                        {currentWizardStep > step.id ? <Check className="h-6 w-6" /> : step.id}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <div className={`font-medium ${currentWizardStep >= step.id ? 'text-white' : 'text-slate-500'}`}>
                                            {step.label}
                                        </div>
                                        <div className="text-xs text-slate-500">{step.description}</div>
                                    </div>
                                </div>
                                {index < wizardSteps.length - 1 && (
                                    <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${currentWizardStep > step.id ? 'bg-green-500' : 'bg-slate-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl animate-fade-in">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Step 1: Basic Info */}
                {currentWizardStep === 1 && (
                    <div className="animate-fade-in space-y-8">
                        <div className="glass-card rounded-2xl p-8">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-white" />
                                </div>
                                Basic Information
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                        Workflow Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input-premium"
                                        placeholder="e.g., Invoice Processing Pipeline"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input-premium min-h-[100px] resize-none"
                                        placeholder="Describe what this workflow does..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-8">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-white" />
                                </div>
                                Choose Trigger
                            </h2>
                            <p className="text-slate-500 mb-6">How should this workflow be started?</p>

                            <div className="grid grid-cols-2 gap-4">
                                {triggerTypes.map((trigger) => (
                                    <button
                                        key={trigger.value}
                                        type="button"
                                        onClick={() => setTriggerType(trigger.value)}
                                        className={`trigger-card p-5 rounded-xl text-left transition-all border-2 ${triggerType === trigger.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${trigger.color} flex items-center justify-center shadow-lg`}>
                                                <trigger.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 dark:text-white">{trigger.label}</div>
                                                <div className="text-sm text-slate-500 mt-1">{trigger.description}</div>
                                            </div>
                                            {triggerType === trigger.value && (
                                                <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center">
                                                    <Check className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Build Flow */}
                {currentWizardStep === 2 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="glass-card rounded-2xl p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                            <Play className="h-4 w-4 text-white" />
                                        </div>
                                        Workflow Steps
                                    </h2>
                                    <p className="text-slate-500 mt-1">Add and configure the steps in your workflow</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowStepModal(true)}
                                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl"
                                >
                                    <Plus className="h-5 w-5" />
                                    Add Step
                                </button>
                            </div>

                            {steps.length === 0 ? (
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 text-center">
                                    <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Plus className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 mb-4">No steps added yet</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowStepModal(true)}
                                        className="text-primary-500 hover:text-primary-600 font-semibold"
                                    >
                                        Add your first step →
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {steps.map((step, index) => {
                                        const StepIcon = getStepIcon(step.type);
                                        const stepColor = getStepColor(step.type);

                                        return (
                                            <div key={step.id} className="relative">
                                                {index < steps.length - 1 && (
                                                    <div className="absolute left-8 top-full w-0.5 h-4 bg-gradient-to-b from-primary-500 to-accent-500 z-0" />
                                                )}

                                                <div className={`step-card rounded-xl border-2 overflow-hidden ${step.isExpanded
                                                    ? 'border-primary-500/50 bg-primary-50/50 dark:bg-primary-900/10'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                    }`}>
                                                    <div className="flex items-center gap-4 p-4">
                                                        <div className="cursor-grab text-slate-400 hover:text-slate-600">
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>
                                                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stepColor} flex items-center justify-center shadow-md`}>
                                                            <StepIcon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={step.name}
                                                                onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                                                className="font-semibold bg-transparent border-none p-0 focus:ring-0 w-full text-slate-900 dark:text-white"
                                                                placeholder="Step name"
                                                            />
                                                            <span className="text-sm text-slate-500">
                                                                {stepTypes.find(s => s.value === step.type)?.label}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStepExpanded(step.id)}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            {step.isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStep(step.id)}
                                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>

                                                    {step.isExpanded && (
                                                        <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
                                                            {step.type === 'ai_process' && (
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-2">AI Prompt <span className="text-red-500">*</span></label>
                                                                    <textarea
                                                                        value={(step.config.prompt as string) || ''}
                                                                        onChange={(e) => updateStep(step.id, { config: { ...step.config, prompt: e.target.value } })}
                                                                        className="input-premium min-h-[120px] font-mono text-sm"
                                                                        placeholder="Enter your AI prompt here. Use {{variable}} for dynamic data."
                                                                    />
                                                                </div>
                                                            )}
                                                            {step.type === 'email' && (
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-2">To Email <span className="text-red-500">*</span></label>
                                                                        <input
                                                                            type="text"
                                                                            value={(step.config.to as string) || ''}
                                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, to: e.target.value } })}
                                                                            className="input-premium"
                                                                            placeholder="email@example.com"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-2">Subject <span className="text-red-500">*</span></label>
                                                                        <input
                                                                            type="text"
                                                                            value={(step.config.subject as string) || ''}
                                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, subject: e.target.value } })}
                                                                            className="input-premium"
                                                                            placeholder="Email subject"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-sm font-medium mb-2">Body</label>
                                                                        <textarea
                                                                            value={(step.config.body as string) || ''}
                                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, body: e.target.value } })}
                                                                            className="input-premium min-h-[80px]"
                                                                            placeholder="Email body content..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {step.type === 'webhook' && (
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div className="col-span-2">
                                                                        <label className="block text-sm font-medium mb-2">URL <span className="text-red-500">*</span></label>
                                                                        <input
                                                                            type="url"
                                                                            value={(step.config.url as string) || ''}
                                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, url: e.target.value } })}
                                                                            className="input-premium"
                                                                            placeholder="https://api.example.com/webhook"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium mb-2">Method</label>
                                                                        <select
                                                                            value={(step.config.method as string) || 'POST'}
                                                                            onChange={(e) => updateStep(step.id, { config: { ...step.config, method: e.target.value } })}
                                                                            className="input-premium"
                                                                        >
                                                                            <option value="GET">GET</option>
                                                                            <option value="POST">POST</option>
                                                                            <option value="PUT">PUT</option>
                                                                            <option value="PATCH">PATCH</option>
                                                                            <option value="DELETE">DELETE</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {step.type === 'save_data' && (
                                                                <div>
                                                                    <label className="block text-sm font-medium mb-2">Collection Name <span className="text-red-500">*</span></label>
                                                                    <input
                                                                        type="text"
                                                                        value={(step.config.collection as string) || ''}
                                                                        onChange={(e) => updateStep(step.id, { config: { ...step.config, collection: e.target.value, mapping: {} } })}
                                                                        className="input-premium"
                                                                        placeholder="e.g., processed_invoices"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {currentWizardStep === 3 && (
                    <div className="animate-fade-in space-y-6">
                        <div className="glass-card rounded-2xl p-8">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                </div>
                                Review Your Workflow
                            </h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="text-sm text-slate-500">Workflow Name</div>
                                        <div className="font-semibold text-lg">{name}</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm text-slate-500">Trigger Type</div>
                                        <div className="font-semibold text-lg capitalize">{triggerType.replace('_', ' ')}</div>
                                    </div>
                                </div>

                                {description && (
                                    <div className="space-y-2">
                                        <div className="text-sm text-slate-500">Description</div>
                                        <div className="text-slate-700 dark:text-slate-300">{description}</div>
                                    </div>
                                )}

                                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                    <div className="text-sm text-slate-500 mb-4">Workflow Steps ({steps.length})</div>
                                    <div className="space-y-3">
                                        {steps.map((step, index) => {
                                            const StepIcon = getStepIcon(step.type);
                                            const stepColor = getStepColor(step.type);

                                            return (
                                                <div key={step.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                    <div className="text-slate-400 font-mono text-sm w-6">{index + 1}</div>
                                                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                                                        <StepIcon className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{step.name}</div>
                                                        <div className="text-sm text-slate-500">{stepTypes.find(s => s.value === step.type)?.label}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        {currentWizardStep > 1 && (
                            <button
                                type="button"
                                onClick={() => setCurrentWizardStep(currentWizardStep - 1)}
                                className="btn-secondary flex items-center gap-2 px-6 py-3 rounded-xl"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                Previous
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/workflows" className="btn-ghost px-6 py-3 rounded-xl">
                            Cancel
                        </Link>
                        {currentWizardStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentWizardStep(currentWizardStep + 1)}
                                disabled={!canProceedToNext()}
                                className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl disabled:opacity-50"
                            >
                                Next
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Create Workflow
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Step Type Modal */}
            {showStepModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold">Add New Step</h3>
                                <p className="text-sm text-slate-500 mt-1">Choose the type of action</p>
                            </div>
                            <button
                                onClick={() => setShowStepModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {stepTypes.map((stepType) => (
                                <button
                                    key={stepType.value}
                                    onClick={() => addStep(stepType.value as Step['type'])}
                                    className="step-card p-5 text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                >
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stepType.color} flex items-center justify-center mb-3 shadow-lg`}>
                                        <stepType.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="font-semibold">{stepType.label}</div>
                                    <div className="text-sm text-slate-500 mt-1">{stepType.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
