import { Sparkles, Loader2, Clock, ExternalLink } from 'lucide-react'
import useStore from '../../store/useStore'

function AnswerDisplay({ query }) {
    const { setCurrentTime } = useStore()

    if (query.loading) {
        return (
            <div className="p-4 bg-white border border-neutral-200 rounded-xl">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                    <span className="text-sm text-neutral-700">Searching through video...</span>
                </div>
            </div>
        )
    }

    if (query.error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{query.error}</p>
            </div>
        )
    }

    if (!query.answer) return null

    const { text, citations, videoUrl } = query.answer

    // Format timestamp
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
            {/* Answer Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-900" />
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Answer</span>
            </div>

            {/* Answer Content */}
            <div className="p-4">
                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {text}
                </p>

                {/* Citations */}
                {citations && citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-3">
                            Sources
                        </h4>
                        <div className="space-y-2">
                            {citations.map((citation, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentTime(citation.timestamp)}
                                    className="w-full flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded text-left transition-all group"
                                >
                                    <span className="font-mono text-xs text-gray-500 shrink-0 mt-0.5 group-hover:text-gray-900 font-medium">
                                        {formatTime(citation.timestamp)}
                                    </span>
                                    <span className="text-xs text-gray-700 group-hover:text-gray-900 line-clamp-2">
                                        "{citation.text}"
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Jump to Video */}
                {videoUrl && (
                    <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 transition-colors font-medium"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in YouTube
                    </a>
                )}
            </div>
        </div>
    )
}

export default AnswerDisplay
