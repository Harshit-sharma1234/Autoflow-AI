import Link from 'next/link';
import Image from 'next/image';
import {
    Zap, FileText, Brain, Workflow, ArrowRight, Sparkles, Cpu,
    Layers, BarChart3, Shield, Rocket, ChevronRight, Check
} from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#000000]">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-white">AutoFlow AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
                            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">How it Works</a>
                            <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
                            <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Docs</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Link href="/register" className="btn-primary text-sm">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Background Image */}
            <section className="relative min-h-screen flex items-center justify-center px-6">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-bg.jpg"
                        alt=""
                        fill
                        className="object-cover object-center"
                        priority
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center pt-16">
                    {/* Badge */}
                    <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-4 py-1.5 text-sm text-blue-400 mb-8">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Powered by Next-Gen AI
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                        <span className="text-white">Automate Workflows with</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Intelligent AI</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Upload documents, extract insights with AI, and trigger automated actions.
                        Build powerful workflows in minutes, not hours.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/register" className="btn-primary px-8 py-3.5 text-base">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                        <Link href="#how-it-works" className="btn-secondary px-8 py-3.5 text-base backdrop-blur-sm">
                            See How It Works
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-3 gap-8 max-w-md mx-auto">
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white">10x</div>
                            <div className="text-xs text-zinc-400 mt-1">Faster</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white">99%</div>
                            <div className="text-xs text-zinc-400 mt-1">Accuracy</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white">24/7</div>
                            <div className="text-xs text-zinc-400 mt-1">Automation</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-[#09090b]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-zinc-400 max-w-xl mx-auto">
                            A complete platform for AI-powered document processing and workflow automation.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: FileText, title: 'Document Processing', desc: 'Upload PDFs, images, and text files with accurate AI extraction.', color: 'blue' },
                            { icon: Brain, title: 'AI Analysis', desc: 'Extract structured data and generate insights using advanced AI.', color: 'violet' },
                            { icon: Workflow, title: 'Automated Workflows', desc: 'Trigger emails, webhooks, or save data automatically.', color: 'cyan' },
                            { icon: Cpu, title: 'Multiple AI Providers', desc: 'Choose from OpenAI, Google Gemini, or Groq.', color: 'orange' },
                            { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Monitor workflow performance and track runs.', color: 'pink' },
                            { icon: Shield, title: 'Enterprise Security', desc: 'End-to-end encryption and role-based access.', color: 'teal' },
                        ].map((feature, i) => (
                            <div key={i} className="card-glow p-6">
                                <div className={`h-10 w-10 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                                    <feature.icon className={`h-5 w-5 text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-zinc-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 px-6 bg-black">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-zinc-400 max-w-xl mx-auto">
                            Three simple steps to automate your document workflows.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { step: '1', title: 'Upload', desc: 'Upload documents or connect to data sources like S3, Drive, or webhooks.', icon: Layers },
                            { step: '2', title: 'Process', desc: 'AI analyzes and extracts structured data using your custom prompts.', icon: Brain },
                            { step: '3', title: 'Automate', desc: 'Trigger emails, API calls, or database writes based on results.', icon: Zap },
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-blue-500/20 mb-6">
                                    <item.icon className="h-7 w-7 text-blue-400" />
                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-zinc-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-[#09090b]">
                <div className="max-w-3xl mx-auto">
                    <div className="rounded-2xl bg-zinc-900/50 border border-blue-500/10 p-8 md:p-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Ready to Automate Your Workflows?
                        </h2>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                            Start your free trial today. No credit card required.
                        </p>
                        <Link href="/register" className="btn-primary px-6 py-3">
                            Get Started Free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/5 bg-black">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold text-white">AutoFlow AI</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms</a>
                            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Docs</a>
                        </div>
                        <p className="text-sm text-zinc-600">
                            © {new Date().getFullYear()} AutoFlow AI
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
