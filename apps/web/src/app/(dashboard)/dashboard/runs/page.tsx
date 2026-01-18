'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { api, handleApiError } from '@/lib/api';

interface Run {
    _id: string;
    workflowId: {
        _id: string;
        name: string;
    };
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt?: string;
    completedAt?: string;
    error?: string;
    createdAt: string;
}

export default function RunsPage() {
    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRuns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/v1/runs');
            setRuns(response.data.data.runs || []);
            setError(null);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
    }, []);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
            running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
        return styles[status] || styles.pending;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4" />;
            case 'failed': return <XCircle className="h-4 w-4" />;
            case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
            case 'cancelled': return <AlertCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const formatDuration = (start?: string, end?: string) => {
        if (!start) return '-';
        const startTime = new Date(start).getTime();
        const endTime = end ? new Date(end).getTime() : Date.now();
        const seconds = Math.floor((endTime - startTime) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
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
                    <h1 className="text-3xl font-bold">Workflow Runs</h1>
                    <p className="text-slate-600 dark:text-slate-400">Monitor your workflow executions</p>
                </div>
                <button onClick={fetchRuns} className="btn-secondary">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {runs.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No runs yet</h3>
                    <p className="text-slate-500 mb-4">Trigger a workflow to see execution history</p>
                    <Link href="/dashboard/workflows" className="text-primary-500 hover:underline">
                        Go to Workflows
                    </Link>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Workflow</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Started</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {runs.map((run) => (
                                <tr key={run._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/dashboard/workflows/${run.workflowId?._id}`}
                                            className="font-medium hover:text-primary-500"
                                        >
                                            {run.workflowId?.name || 'Unknown Workflow'}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(run.status)}`}>
                                            {getStatusIcon(run.status)}
                                            {run.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">
                                        {run.startedAt ? new Date(run.startedAt).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">
                                        {formatDuration(run.startedAt, run.completedAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
