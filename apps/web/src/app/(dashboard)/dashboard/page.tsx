'use client';

import { useAuth } from '@/providers/auth-provider';
import { Workflow, Play, Clock, CheckCircle, TrendingUp, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        { label: 'Total Workflows', value: '12', icon: Workflow },
        { label: 'Runs Today', value: '47', icon: Play },
        { label: 'Success Rate', value: '94%', icon: TrendingUp },
        { label: 'Documents', value: '1,284', icon: FileText },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-slate-600 dark:text-slate-400">Here's your workflow overview.</p>
                </div>
                <Link href="/dashboard/workflows/new" className="btn-primary">
                    <Plus className="h-5 w-5 mr-2" />New Workflow
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-600">{stat.label}</p>
                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                                <stat.icon className="h-6 w-6 text-primary-600" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
                <p className="text-slate-500">No recent runs. Create a workflow to get started!</p>
            </div>
        </div>
    );
}
