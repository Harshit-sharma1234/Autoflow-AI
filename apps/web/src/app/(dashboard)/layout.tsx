'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
    Zap, LayoutDashboard, Workflow, Play, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/workflows', label: 'Workflows', icon: Workflow },
    { href: '/dashboard/runs', label: 'Runs', icon: Play },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
                <div className="flex items-center h-16 px-6 border-b">
                    <Zap className="h-8 w-8 text-primary-500" />
                    <span className="ml-2 font-bold text-xl">AutoFlow</span>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <button onClick={logout} className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-red-50 text-red-600">
                        <LogOut className="h-5 w-5 mr-3" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                <header className="h-16 bg-white dark:bg-slate-800 border-b flex items-center px-6">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden mr-4">
                        {sidebarOpen ? <X /> : <Menu />}
                    </button>
                    <div className="ml-auto">{user?.email}</div>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
