import { useState } from 'react'
import { Search, Sparkles, MessageSquare } from 'lucide-react'
import useStore, { VIDEO_STATES } from '../../store/useStore'
import AnswerDisplay from './AnswerDisplay'
import EvidenceStack from './EvidenceStack'

function QueryPanel() {
    const [question, setQuestion] = useState('')
    const { queries, queryVideo, activeVideoId, videos } = useStore()

    const activeVideo = activeVideoId ? videos[activeVideoId] : null
    const isReady = activeVideo?.state?.status === VIDEO_STATES.READY
    const latestQuery = queries[queries.length - 1]

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!question.trim() || !isReady) return

        await queryVideo(question.trim())
        setQuestion('')
    }

    // Suggested questions based on typical video content
    const suggestedQuestions = [
        'What is the main topic?',
        'Summarize the key points',
        'Explain the core concepts',
    ]

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Ask & Discover
                </h2>
            </div>

            {/* Question Input */}
            <div className="p-4 border-b border-gray-200">
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={isReady ? "Ask about videos in this folder..." : "Select a ready video first..."}
                            disabled={!isReady}
                            className="w-full bg-white border border-gray-300 rounded pl-10 pr-4 py-3 text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        />
                    </div>

                    {isReady && !question && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {suggestedQuestions.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => setQuestion(q)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded text-xs text-gray-700 hover:text-gray-900 transition-all font-medium"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}
                </form>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                {latestQuery ? (
                    <div className="p-4 space-y-4">
                        {/* Question */}
                        <div className="text-sm text-gray-900 font-medium">
                            {latestQuery.text}
                        </div>

                        {/* Answer */}
                        <AnswerDisplay query={latestQuery} />

                        {/* Evidence */}
                        {latestQuery.evidence?.length > 0 && (
                            <EvidenceStack evidence={latestQuery.evidence} />
                        )}
                    </div>
                ) : (
                    // Empty State
                    <div className="flex flex-col h-full p-6">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
                            <Sparkles className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-2">
                            {activeVideo
                                ? 'Ask a question about videos in this folder'
                                : 'Select a video to start asking questions'
                            }
                        </p>
                        <p className="text-xs text-gray-500 font-light">
                            Answers include timestamps and evidence
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QueryPanel
