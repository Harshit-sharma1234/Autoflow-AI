'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Zap, LayoutDashboard, Workflow, Play, Settings, LogOut, Menu, X,
    ChevronRight, ChevronLeft, Bell, Search, User, Sparkles, PanelLeftClose, PanelLeft
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/workflows', label: 'Workflows', icon: Workflow },
    { href: '/dashboard/runs', label: 'Runs', icon: Play },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // TEMPORARY: Auth bypass for development
    const BYPASS_AUTH = true;

    useEffect(() => {
        if (!BYPASS_AUTH && !isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (!BYPASS_AUTH && isLoading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-zinc-500 text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    if (!BYPASS_AUTH && !isAuthenticated) return null;

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname?.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-[#09090b]">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-60'} glass-sidebar transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 flex flex-col`}>
                {/* Logo */}
                <div className="flex items-center justify-between h-14 px-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <span className="font-semibold text-white">AutoFlow</span>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                    >
                        {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={sidebarCollapsed ? item.label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${active
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
                                {!sidebarCollapsed && (
                                    <>
                                        <span className="flex-1 text-sm">{item.label}</span>
                                        {active && <ChevronRight className="h-4 w-4" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* AI Badge */}
                {!sidebarCollapsed && (
                    <div className="mx-2 mb-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-blue-400" />
                            <span className="text-xs font-medium text-white">AI Ready</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Powered by OpenAI, Gemini & Groq</p>
                    </div>
                )}

                {/* Logout */}
                <div className="p-2 border-t border-white/5">
                    <button
                        onClick={logout}
                        title={sidebarCollapsed ? "Logout" : undefined}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'} transition-all duration-300`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 h-14 glass-navbar flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <X className="h-5 w-5 text-zinc-400" /> : <Menu className="h-5 w-5 text-zinc-400" />}
                        </button>

                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 w-72">
                            <Search className="h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search workflows, runs..."
                                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                            />
                            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 border border-white/5">
                                ⌘K
                            </kbd>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Bell className="h-5 w-5 text-zinc-400" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-2 pl-3 border-l border-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-white">{user?.email?.split('@')[0] || 'User'}</div>
                                <div className="text-xs text-zinc-500">Pro Plan</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 min-h-[calc(100vh-3.5rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
