'use client';

import { useAuth } from '@/providers/auth-provider';
import {
    Workflow, Play, TrendingUp, FileText, Plus, ArrowUpRight,
    Clock, CheckCircle, XCircle, Zap, Brain, ChevronRight, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        { label: 'Active Workflows', value: '12', change: '+2', icon: Workflow, color: 'from-blue-500 to-cyan-500', trend: 'up' },
        { label: 'Runs Today', value: '47', change: '+12', icon: Play, color: 'from-violet-500 to-purple-500', trend: 'up' },
        { label: 'Success Rate', value: '94%', change: '+3%', icon: TrendingUp, color: 'from-green-500 to-emerald-500', trend: 'up' },
        { label: 'Documents', value: '1.2K', change: '+89', icon: FileText, color: 'from-orange-500 to-red-500', trend: 'up' },
    ];

    const recentRuns = [
        { name: 'Invoice Processing', status: 'completed', time: '2 min ago', duration: '1.2s' },
        { name: 'Email Extraction', status: 'completed', time: '5 min ago', duration: '0.8s' },
        { name: 'Contract Analysis', status: 'running', time: 'Just now', duration: '...' },
        { name: 'Report Generator', status: 'failed', time: '12 min ago', duration: '2.1s' },
    ];

    const workflows = [
        { name: 'Invoice Processing', runs: 234, success: 98, trigger: 'File Upload' },
        { name: 'Email Extraction', runs: 156, success: 95, trigger: 'Webhook' },
        { name: 'Contract Analysis', runs: 89, success: 92, trigger: 'Manual' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                    </h1>
                    <p className="text-zinc-500 mt-1">Here's what's happening with your automations.</p>
                </div>
                <Link
                    href="/dashboard/workflows/new"
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    New Workflow
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="card group hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-zinc-500">{stat.label}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                    <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Runs - 2 cols */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                <Play className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Recent Runs</h2>
                                <p className="text-sm text-zinc-500">Latest workflow executions</p>
                            </div>
                        </div>
                        <Link href="/dashboard/runs" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            View all <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {recentRuns.map((run, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${run.status === 'completed' ? 'bg-green-500' :
                                            run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                'bg-red-500'
                                        }`} />
                                    <div>
                                        <p className="font-medium text-white">{run.name}</p>
                                        <p className="text-sm text-zinc-500">{run.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-zinc-400">{run.duration}</span>
                                    {run.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    {run.status === 'running' && <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
                                    {run.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions - 1 col */}
                <div className="space-y-6">
                    {/* AI Status Card */}
                    <div className="card relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-violet-500/20 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                    <Brain className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">AI Status</h3>
                                    <p className="text-sm text-zinc-500">All systems operational</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">OpenAI GPT-4</span>
                                    <span className="text-green-400 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        Online
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Groq LLaMA</span>
                                    <span className="text-green-400 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        Online
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">Google Gemini</span>
                                    <span className="text-green-400 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                                        Online
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link
                                href="/dashboard/workflows/new"
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/30 transition-all group"
                            >
                                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white">Create Workflow</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-blue-400" />
                            </Link>
                            <Link
                                href="/dashboard/workflows"
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-violet-500/30 transition-all group"
                            >
                                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <Workflow className="h-4 w-4 text-violet-400" />
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white">View Workflows</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-violet-400" />
                            </Link>
                            <Link
                                href="/dashboard/runs"
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-green-500/30 transition-all group"
                            >
                                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-green-400" />
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white">View All Runs</span>
                                <ArrowUpRight className="h-4 w-4 text-zinc-600 ml-auto group-hover:text-green-400" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Workflows */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Top Workflows</h2>
                            <p className="text-sm text-zinc-500">Your most active automations</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-white/5">
                                <th className="pb-4 text-sm font-medium text-zinc-500">Workflow</th>
                                <th className="pb-4 text-sm font-medium text-zinc-500">Trigger</th>
                                <th className="pb-4 text-sm font-medium text-zinc-500">Total Runs</th>
                                <th className="pb-4 text-sm font-medium text-zinc-500">Success Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workflows.map((wf, i) => (
                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4">
                                        <span className="font-medium text-white">{wf.name}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm text-zinc-400">{wf.trigger}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm text-zinc-300">{wf.runs}</span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                    style={{ width: `${wf.success}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-green-400">{wf.success}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
