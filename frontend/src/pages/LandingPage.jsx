import { ArrowRight, Video, MessageSquare, Zap, Github } from 'lucide-react'
import { Link } from 'react-router-dom'

function LandingPage() {
    const features = [
        {
            icon: Video,
            title: 'Add Any Video',
            description: 'Paste a YouTube URL and Kanting watches it for you. Works with lectures, tutorials, podcasts, and any video content.',
        },
        {
            icon: MessageSquare,
            title: 'Ask Anything',
            description: 'Natural language questions about video content. No more scrubbing through hours of footage to find what you need.',
        },
        {
            icon: Zap,
            title: 'Instant Answers',
            description: 'AI-powered responses with exact timestamps. Jump directly to the moments that matter most.',
        },
    ]

    return (
        <div className="min-h-screen bg-white font-['Inter',sans-serif] antialiased text-gray-900 selection:bg-gray-100 selection:text-gray-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-medium tracking-tight text-gray-900">Kanting</div>
                        <div className="text-sm text-gray-500 font-light">看听</div>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            GitHub
                        </a>
                        <Link to="/app" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded transition-colors">
                            Launch App
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-24 px-6 max-w-6xl mx-auto bg-white">
                <div className="max-w-3xl">
                    <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full mb-8 font-medium">
                        Video Intelligence Powered by AI
                    </div>

                    <h1 className="text-6xl font-medium text-gray-900 mb-6 leading-[1.1] tracking-tight">
                        Ask questions about any video
                    </h1>

                    <p className="text-xl text-gray-600 mb-10 leading-relaxed font-light">
                        I watch and listen so you don't have to. Get AI-powered answers with precise timestamps.
                        Never waste time scrubbing through videos again.
                    </p>

                    <div className="flex items-center gap-4">
                        <Link to="/app" className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded transition-colors flex items-center gap-2">
                            Try it Now
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors">
                            View on GitHub
                        </button>
                    </div>
                </div>
            </section>

            {/* Demo Section (Part of White Block, or start of Gray?) 
                User asked for alternating sections. Let's make this Gray to break it up? 
                Or keep Hero White, Demo White, Then Steps Gray. 
                Let's keep Demo in White flow or adding a border. 
                I'll put the Demo in the next Gray section or keep it simple.
                Actually, let's treat "How it Works" as the first Gray section.
            */}

            {/* How It Works (Steps) - Gray 50 */}
            <section className="bg-gray-50 border-y border-gray-200 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl font-medium text-gray-900 mb-4 tracking-tight">
                            How it Works
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl font-light">
                            Three simple steps to unlock the knowledge in any video
                        </p>
                    </div>

                    <div className="space-y-16">
                        {[
                            {
                                step: '01',
                                title: 'Paste Video URL',
                                description: 'Copy any YouTube link and paste it into Kanting. Our AI begins processing the content immediately, analyzing both the transcript and visual elements.',
                            },
                            {
                                step: '02',
                                title: 'AI Analyzes Content',
                                description: 'Advanced language models watch and understand the video context, extracting key information, topics, and timestamps automatically.',
                            },
                            {
                                step: '03',
                                title: 'Ask Questions',
                                description: 'Chat naturally about the video content. Get instant answers with exact timestamps pointing you to the relevant moments.',
                            },
                        ].map((item, index) => (
                            <div key={index} className="flex gap-12 max-w-4xl">
                                <div className="flex-shrink-0 w-16 text-2xl font-semibold text-gray-300">
                                    {item.step}
                                </div>
                                <div className="flex-1 max-w-2xl">
                                    <h3 className="text-2xl font-medium text-gray-900 mb-4 tracking-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-lg text-gray-600 leading-relaxed font-light">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features - White */}
            <section className="bg-white py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl font-medium text-gray-900 mb-4 tracking-tight">
                            Features
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl font-light">
                            Everything you need to understand video content instantly
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <div key={index}>
                                    <div className="mb-6">
                                        <Icon className="w-8 h-8 text-gray-900" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-3 tracking-tight">
                                        {feature.title}
                                    </h3>
                                    <p className="text-lg text-gray-600 leading-relaxed font-light">
                                        {feature.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Use Cases - Gray 50 */}
            <section className="bg-gray-50 border-y border-gray-200 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl font-medium text-gray-900 mb-4 tracking-tight">
                            Built For
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl font-light">
                            Whether you're learning, working, or creating
                        </p>
                    </div>

                    <div className="space-y-12">
                        {[
                            {
                                title: 'Students & Researchers',
                                description: 'Study lecture videos efficiently. Find specific topics and concepts without watching entire recordings.',
                            },
                            {
                                title: 'Professionals',
                                description: 'Extract insights from conference talks, webinars, and training videos. Stay up to date without spending hours watching content.',
                            },
                            {
                                title: 'Content Creators',
                                description: 'Research competitor videos and analyze trends. Find specific content moments quickly for reaction videos or commentary.',
                            },
                        ].map((useCase, index) => (
                            <div key={index} className="max-w-3xl">
                                <h3 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                                    {useCase.title}
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed font-light">
                                    {useCase.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA - Dark */}
            <section className="bg-gray-900 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="max-w-3xl">
                        <h2 className="text-4xl font-medium text-white mb-6 tracking-tight">
                            Ready to get started?
                        </h2>
                        <p className="text-xl text-gray-300 mb-10 leading-relaxed font-light">
                            Stop wasting time watching entire videos. Let AI find exactly what you need.
                        </p>
                        <button className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded transition-colors flex items-center gap-2">
                            Launch Kanting
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pt-12 pb-12">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-2">
                            <div className="text-xl font-medium tracking-tight text-gray-900">Kanting</div>
                            <div className="text-sm text-gray-500 font-light">看听</div>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-gray-600">
                            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                            <a href="https://github.com" className="hover:text-gray-900 transition-colors">GitHub</a>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-200">
                        <p className="text-sm text-gray-500 font-light">
                            © 2025 Kanting. Video Intelligence Powered by AI.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage