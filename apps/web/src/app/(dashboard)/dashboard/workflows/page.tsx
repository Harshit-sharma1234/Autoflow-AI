'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Play, Pause, Trash2, Edit, MoreVertical, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { api, handleApiError } from '@/lib/api';

interface Workflow {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'paused' | 'draft';
    trigger: {
        type: string;
    };
    createdAt: string;
    updatedAt: string;
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await api.get('/v1/workflows');
            // Backend returns { success: true, data: [...workflows...] } directly
            setWorkflows(response.data.data || []);
            setError(null);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        try {
            await api.delete(`/v1/workflows/${id}`);
            setWorkflows(workflows.filter(w => w.id !== id));
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            const endpoint = currentStatus === 'active' ? 'pause' : 'activate';
            await api.post(`/v1/workflows/${id}/${endpoint}`);
            fetchWorkflows();
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handleRun = async (id: string) => {
        try {
            const response = await api.post(`/v1/workflows/${id}/trigger`, { input: {} });
            alert(`Workflow triggered successfully! Run ID: ${response.data.data.runId}`);
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            draft: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
        };
        return styles[status as keyof typeof styles] || styles.draft;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="h-4 w-4" />;
            case 'paused': return <Clock className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Workflows</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage your automation workflows</p>
                </div>
                <Link href="/dashboard/workflows/new" className="btn-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    New Workflow
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {workflows.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
                    <p className="text-slate-500 mb-4">Create your first workflow to start automating</p>
                    <Link href="/dashboard/workflows/new" className="btn-primary inline-flex">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Workflow
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workflows.map((workflow) => (
                        <div key={workflow.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <Link href={`/dashboard/workflows/${workflow.id}`} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(workflow.status)}`}>
                                            {getStatusIcon(workflow.status)}
                                            {workflow.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mb-2">
                                        {workflow.description || 'No description'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span>Trigger: {workflow.trigger?.type || 'manual'}</span>
                                        <span>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRun(workflow.id)}
                                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                        title="Run workflow now"
                                    >
                                        <Zap className="h-5 w-5 text-primary-500" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                        title={workflow.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
                                    >
                                        {workflow.status === 'active' ? (
                                            <Pause className="h-5 w-5 text-yellow-500" />
                                        ) : (
                                            <Play className="h-5 w-5 text-green-500" />
                                        )}
                                    </button>
                                    <Link
                                        href={`/dashboard/workflows/${workflow.id}`}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                        title="Edit workflow"
                                    >
                                        <Edit className="h-5 w-5 text-slate-500" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(workflow.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="Delete workflow"
                                    >
                                        <Trash2 className="h-5 w-5 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
