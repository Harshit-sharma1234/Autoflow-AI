import Link from 'next/link';
import {
    Zap,
    FileText,
    Brain,
    Workflow,
    ArrowRight,
    CheckCircle,
    Sparkles
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <Zap className="h-8 w-8 text-primary-500" />
                            <span className="text-xl font-bold gradient-text">AutoFlow AI</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="btn-ghost">
                                Sign In
                            </Link>
                            <Link href="/register" className="btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300 mb-6">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Powered by Advanced AI
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                            Automate Workflows with
                            <span className="gradient-text block">Intelligent AI</span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
                            Upload documents, extract insights with AI, and trigger automated actions.
                            Build powerful workflows in minutes, not hours.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/register" className="btn-primary text-lg px-8 py-3">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                                See How It Works
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-slate-100 dark:bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            A complete platform for AI-powered document processing and workflow automation.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="card hover:shadow-lg transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Document Processing</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Upload PDFs, text files, and more. Our system extracts content automatically.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card hover:shadow-lg transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-4">
                                <Brain className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Extract structured data, classify content, and generate insights with AI.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card hover:shadow-lg transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                <Workflow className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Automated Workflows</h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Trigger emails, webhooks, or save data based on AI-analyzed results.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Three simple steps to automate your document workflows.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Upload', desc: 'Upload your documents or connect data sources' },
                            { step: '02', title: 'Process', desc: 'AI analyzes and extracts structured data' },
                            { step: '03', title: 'Automate', desc: 'Trigger actions based on the results' },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="text-6xl font-bold text-slate-100 dark:text-slate-800 mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-primary-500 to-accent-500">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Automate Your Workflows?
                    </h2>
                    <p className="text-lg text-white/80 mb-8">
                        Start your free trial today. No credit card required.
                    </p>
                    <Link href="/register" className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-lg font-medium text-primary-600 hover:bg-slate-100 transition-colors">
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <Zap className="h-6 w-6 text-primary-500" />
                            <span className="font-semibold">AutoFlow AI</span>
                        </div>
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} AutoFlow AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
