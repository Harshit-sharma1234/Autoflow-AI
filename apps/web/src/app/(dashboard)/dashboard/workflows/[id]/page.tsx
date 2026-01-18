'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Play, Pause, Trash2, Plus, Clock, Zap, Webhook, FileText, Edit } from 'lucide-react';
import { api, handleApiError, uploadFile } from '@/lib/api';
import { Upload } from 'lucide-react';

interface Action {
    id?: string;
    type: 'ai_extract' | 'ai_summarize' | 'ai_classify' | 'ai_process' | 'send_email' | 'email' | 'webhook' | 'transform' | 'save_data';
    config: Record<string, unknown>;
}

interface Workflow {
    _id: string;
    name: string;
    description?: string;
    status: 'active' | 'paused' | 'draft';
    trigger: {
        type: string;
        config?: Record<string, unknown>;
    };
    actions: Action[];
    createdAt: string;
    updatedAt: string;
}

const triggerTypes = [
    { value: 'manual', label: 'Manual Trigger', icon: Zap },
    { value: 'schedule', label: 'Scheduled', icon: Clock },
    { value: 'webhook', label: 'Webhook', icon: Webhook },
    { value: 'file_upload', label: 'File Upload', icon: FileText },
];

const actionTypes = [
    { value: 'ai_extract', label: 'AI Extract' },
    { value: 'ai_summarize', label: 'AI Summarize' },
    { value: 'ai_classify', label: 'AI Classify' },
    { value: 'send_email', label: 'Send Email' },
    { value: 'webhook', label: 'Call Webhook' },
    { value: 'transform', label: 'Transform Data' },
];

export default function WorkflowDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('manual');
    const [actions, setActions] = useState<Action[]>([]);
    const [showActionModal, setShowActionModal] = useState(false);
    const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
    const [editingConfig, setEditingConfig] = useState<Record<string, unknown>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchWorkflow();
    }, [id]);

    const fetchWorkflow = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/v1/workflows/${id}`);
            const data = response.data.data;
            setWorkflow(data);
            setName(data.name);
            setDescription(data.description || '');
            setTriggerType(data.trigger?.type || 'manual');
            setActions(data.steps || []);
            setError(null);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Workflow name is required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await api.patch(`/v1/workflows/${id}`, {
                name,
                description,
                trigger: { type: triggerType },
                actions: actions.map(a => ({ type: a.type, config: a.config })),
            });

            router.push('/dashboard/workflows');
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this workflow? This cannot be undone.')) return;

        try {
            await api.delete(`/v1/workflows/${id}`);
            router.push('/dashboard/workflows');
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handleToggleStatus = async () => {
        if (!workflow) return;

        try {
            const endpoint = workflow.status === 'active' ? 'pause' : 'activate';
            await api.post(`/v1/workflows/${id}/${endpoint}`);
            fetchWorkflow();
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handleTrigger = async () => {
        try {
            setUploading(true);
            setError(null);

            let input: Record<string, unknown> = {};

            // If a file is selected, upload it first
            if (selectedFile) {
                const fileInfo = await uploadFile(selectedFile);
                input = {
                    fileId: fileInfo.id,
                    filePath: fileInfo.path,
                    fileName: fileInfo.originalName,
                    fileType: fileInfo.mimeType,
                };
            }

            const response = await api.post(`/v1/workflows/${id}/trigger`, { input });
            alert(`Workflow triggered successfully! Run ID: ${response.data.data.runId}`);
            setSelectedFile(null);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setUploading(false);
        }
    };

    const addAction = (type: Action['type']) => {
        const newAction: Action = {
            id: crypto.randomUUID(),
            type,
            config: {},
        };
        setActions([...actions, newAction]);
        setShowActionModal(false);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const startEditAction = (index: number) => {
        setEditingActionIndex(index);
        setEditingConfig(actions[index].config || {});
    };

    const saveActionConfig = () => {
        if (editingActionIndex !== null) {
            const newActions = [...actions];
            newActions[editingActionIndex] = {
                ...newActions[editingActionIndex],
                config: editingConfig
            };
            setActions(newActions);
            setEditingActionIndex(null);
            setEditingConfig({});
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!workflow) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Workflow not found</h2>
                <Link href="/dashboard/workflows" className="text-primary-500 hover:underline">
                    Back to workflows
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/workflows" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Workflow</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${workflow.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {workflow.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                        <label className="btn-secondary cursor-pointer">
                            <Upload className="h-4 w-4 mr-1" />
                            {selectedFile ? selectedFile.name : 'Upload File'}
                            <input
                                type="file"
                                accept=".pdf,.txt,.md"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);
                                    }
                                }}
                            />
                        </label>
                        {selectedFile && (
                            <button
                                onClick={() => setSelectedFile(null)}
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleTrigger}
                        disabled={uploading}
                        className="btn-secondary"
                        title="Run workflow now"
                    >
                        <Play className="h-4 w-4 mr-1" />
                        {uploading ? 'Running...' : 'Run'}
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        className="btn-secondary"
                    >
                        {workflow.status === 'active' ? (
                            <><Pause className="h-4 w-4 mr-1" />Pause</>
                        ) : (
                            <><Play className="h-4 w-4 mr-1" />Activate</>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="space-y-6">
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
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Trigger */}
                <div className="card space-y-4">
                    <h2 className="text-lg font-semibold">Trigger</h2>

                    <div className="grid grid-cols-2 gap-3">
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
                                    <span className="font-medium">{trigger.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="card space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Actions</h2>
                        <button
                            type="button"
                            onClick={() => setShowActionModal(true)}
                            className="btn-secondary"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                        </button>
                    </div>

                    {actions.length === 0 ? (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                            <p className="text-slate-500">No actions configured</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {actions.map((action, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-medium text-primary-600">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-medium">
                                            {actionTypes.find(a => a.value === action.type)?.label || action.type}
                                        </span>
                                        {action.config && Object.keys(action.config).length > 0 && (
                                            <div className="text-xs text-slate-500 mt-1">
                                                {Object.entries(action.config).slice(0, 2).map(([key, value]) => (
                                                    <span key={key} className="mr-2">
                                                        {key}: {String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => startEditAction(index)}
                                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                                        title="Edit action"
                                    >
                                        <Edit className="h-4 w-4 text-blue-500" />
                                    </button>
                                    <button
                                        onClick={() => removeAction(index)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions Bar */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex-1"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Add Action</h3>
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {actionTypes.map((action) => (
                                <button
                                    key={action.value}
                                    onClick={() => addAction(action.value as Action['type'])}
                                    className="w-full p-3 text-left border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 transition-all"
                                >
                                    <div className="font-medium">{action.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Action Modal */}
            {editingActionIndex !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                                Edit {actionTypes.find(a => a.value === actions[editingActionIndex]?.type)?.label || 'Action'}
                            </h3>
                            <button
                                onClick={() => { setEditingActionIndex(null); setEditingConfig({}); }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Email-specific fields */}
                            {(actions[editingActionIndex]?.type === 'send_email' || actions[editingActionIndex]?.type === 'email') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">To Email</label>
                                        <input
                                            type="email"
                                            value={(editingConfig.to as string) || ''}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, to: e.target.value })}
                                            className="input-field"
                                            placeholder="recipient@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Subject</label>
                                        <input
                                            type="text"
                                            value={(editingConfig.subject as string) || ''}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, subject: e.target.value })}
                                            className="input-field"
                                            placeholder="Email subject"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Body</label>
                                        <textarea
                                            value={(editingConfig.body as string) || ''}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, body: e.target.value })}
                                            className="input-field"
                                            rows={5}
                                            placeholder="Use {{stepId}} to include results from previous steps"
                                        />
                                    </div>
                                </>
                            )}

                            {/* AI Process fields */}
                            {(actions[editingActionIndex]?.type === 'ai_extract' ||
                                actions[editingActionIndex]?.type === 'ai_summarize' ||
                                actions[editingActionIndex]?.type === 'ai_classify' ||
                                actions[editingActionIndex]?.type === 'ai_process') && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Prompt</label>
                                            <textarea
                                                value={(editingConfig.prompt as string) || ''}
                                                onChange={(e) => setEditingConfig({ ...editingConfig, prompt: e.target.value })}
                                                className="input-field"
                                                rows={5}
                                                placeholder="Enter the AI prompt. Use {{documentContent}} for uploaded file content."
                                            />
                                        </div>
                                    </>
                                )}

                            {/* Webhook fields */}
                            {actions[editingActionIndex]?.type === 'webhook' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">URL</label>
                                        <input
                                            type="url"
                                            value={(editingConfig.url as string) || ''}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, url: e.target.value })}
                                            className="input-field"
                                            placeholder="https://api.example.com/webhook"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Method</label>
                                        <select
                                            value={(editingConfig.method as string) || 'POST'}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, method: e.target.value })}
                                            className="input-field"
                                        >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                            <option value="PUT">PUT</option>
                                            <option value="PATCH">PATCH</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Transform fields */}
                            {actions[editingActionIndex]?.type === 'transform' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Transform Expression</label>
                                        <textarea
                                            value={(editingConfig.expression as string) || ''}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, expression: e.target.value })}
                                            className="input-field"
                                            rows={3}
                                            placeholder="JavaScript expression to transform data"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Save Data fields */}
                            {actions[editingActionIndex]?.type === 'save_data' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Collection Name</label>
                                        <input
                                            type="text"
                                            value={(editingConfig.collection as string) || ''}
                                            onChange={(e) => setEditingConfig({ ...editingConfig, collection: e.target.value })}
                                            className="input-field"
                                            placeholder="e.g., invoices, contacts"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500">Data will be saved automatically from previous step outputs.</p>
                                </>
                            )}

                            <div className="flex gap-2 pt-4">
                                <button
                                    onClick={saveActionConfig}
                                    className="btn-primary flex-1"
                                >
                                    Save Configuration
                                </button>
                                <button
                                    onClick={() => { setEditingActionIndex(null); setEditingConfig({}); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
