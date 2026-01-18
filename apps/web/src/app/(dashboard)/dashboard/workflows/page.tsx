'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Play, Pause, Trash2, Edit, Clock, CheckCircle, AlertCircle, Zap,
    Workflow, Search, Filter, MoreHorizontal, ArrowUpRight
} from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await api.get('/v1/workflows');
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

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return {
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/30',
                    text: 'text-green-400',
                    dot: 'bg-green-500'
                };
            case 'paused':
                return {
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    text: 'text-yellow-400',
                    dot: 'bg-yellow-500'
                };
            default:
                return {
                    bg: 'bg-zinc-500/10',
                    border: 'border-zinc-500/30',
                    text: 'text-zinc-400',
                    dot: 'bg-zinc-500'
                };
        }
    };

    const getTriggerColor = (type: string) => {
        switch (type) {
            case 'manual': return 'from-blue-500 to-cyan-500';
            case 'webhook': return 'from-violet-500 to-purple-500';
            case 'schedule': return 'from-orange-500 to-red-500';
            case 'file_upload': return 'from-green-500 to-emerald-500';
            default: return 'from-zinc-500 to-zinc-600';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <Workflow className="absolute inset-0 m-auto h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-zinc-500 text-sm">Loading workflows...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Workflows</h1>
                    <p className="text-zinc-500 mt-1">Manage your automation workflows</p>
                </div>
                <Link href="/dashboard/workflows/new" className="btn-primary flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    New Workflow
                </Link>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <Search className="h-5 w-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                </div>
                <button className="btn-secondary flex items-center gap-2 px-4 py-3">
                    <Filter className="h-5 w-5" />
                    Filter
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {filteredWorkflows.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-6">
                        <Workflow className="h-10 w-10 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No workflows yet</h3>
                    <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
                        Create your first workflow to start automating your document processing
                    </p>
                    <Link href="/dashboard/workflows/new" className="btn-primary inline-flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Create Workflow
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredWorkflows.map((workflow) => {
                        const statusConfig = getStatusConfig(workflow.status);
                        const triggerColor = getTriggerColor(workflow.trigger?.type || 'manual');

                        return (
                            <div
                                key={workflow.id}
                                className="card group hover:border-white/10 transition-all duration-300"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    {/* Left side - Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Trigger Icon */}
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${triggerColor} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                            <Zap className="h-6 w-6 text-white" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Link
                                                    href={`/dashboard/workflows/${workflow.id}`}
                                                    className="text-lg font-semibold text-white hover:text-blue-400 transition-colors truncate"
                                                >
                                                    {workflow.name}
                                                </Link>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} border ${statusConfig.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                                    {workflow.status}
                                                </span>
                                            </div>
                                            <p className="text-zinc-500 text-sm truncate mb-2">
                                                {workflow.description || 'No description'}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-zinc-600">
                                                <span className="capitalize">Trigger: {workflow.trigger?.type || 'manual'}</span>
                                                <span>•</span>
                                                <span>Updated: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right side - Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRun(workflow.id)}
                                            className="p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                                            title="Run workflow now"
                                        >
                                            <Zap className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(workflow.id, workflow.status)}
                                            className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                                            title={workflow.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
                                        >
                                            {workflow.status === 'active' ? (
                                                <Pause className="h-5 w-5" />
                                            ) : (
                                                <Play className="h-5 w-5" />
                                            )}
                                        </button>
                                        <Link
                                            href={`/dashboard/workflows/${workflow.id}`}
                                            className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                                            title="Edit workflow"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(workflow.id)}
                                            className="p-2.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                                            title="Delete workflow"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
