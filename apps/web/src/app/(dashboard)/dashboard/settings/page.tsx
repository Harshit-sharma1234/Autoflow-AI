'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { User, Bell, Shield, Palette, Save } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    const handleSave = async () => {
        setSaving(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage your account settings and preferences</p>
            </div>

            {message && (
                <div className={`px-4 py-3 rounded-lg ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-48 shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <tab.icon className="h-5 w-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="card space-y-6">
                            <h2 className="text-lg font-semibold">Profile Settings</h2>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user?.name}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        className="input-field"
                                        disabled
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                                </div>
                            </div>

                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="card space-y-6">
                            <h2 className="text-lg font-semibold">Notification Preferences</h2>

                            <div className="space-y-4">
                                {[
                                    { label: 'Email notifications for workflow failures', defaultChecked: true },
                                    { label: 'Email notifications for workflow completions', defaultChecked: false },
                                    { label: 'Weekly summary emails', defaultChecked: true },
                                    { label: 'Marketing and product updates', defaultChecked: false },
                                ].map((item, i) => (
                                    <label key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <span>{item.label}</span>
                                        <input
                                            type="checkbox"
                                            defaultChecked={item.defaultChecked}
                                            className="h-5 w-5 text-primary-500 rounded"
                                        />
                                    </label>
                                ))}
                            </div>

                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="card space-y-6">
                            <h2 className="text-lg font-semibold">Security Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Current Password</label>
                                    <input type="password" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">New Password</label>
                                    <input type="password" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                                    <input type="password" className="input-field" />
                                </div>
                            </div>

                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Updating...' : 'Update Password'}
                            </button>

                            <hr className="border-slate-200 dark:border-slate-700" />

                            <div>
                                <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                                <p className="text-sm text-slate-500 mb-3">Add an extra layer of security to your account</p>
                                <button className="btn-secondary">Enable 2FA</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="card space-y-6">
                            <h2 className="text-lg font-semibold">Appearance</h2>

                            <div>
                                <label className="block text-sm font-medium mb-3">Theme</label>
                                <div className="flex gap-3">
                                    {['Light', 'Dark', 'System'].map((theme) => (
                                        <button
                                            key={theme}
                                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500"
                                        >
                                            {theme}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
