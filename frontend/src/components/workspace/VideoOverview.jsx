import { VIDEO_STATES } from '../../store/useStore'
import { Clock, Tag, FileText, CheckCircle, Loader2 } from 'lucide-react'

function VideoOverview({ video }) {
    const { state, summary, youtubeUrl, addedAt } = video
    const isReady = state.status === VIDEO_STATES.READY
    const isProcessing = [
        VIDEO_STATES.UPLOADING,
        VIDEO_STATES.TRANSCRIBING,
        VIDEO_STATES.SEGMENTING,
        VIDEO_STATES.INDEXING,
    ].includes(state.status)

    // Extract topics from summary (simple parsing)
    const extractTopics = (text) => {
        if (!text) return []
        const words = text.split(/\s+/)
        const commonWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'or', 'but', 'if', 'because', 'until', 'while', 'that', 'this', 'these', 'those', 'it', 'its'])
        const topics = words
            .filter(w => w.length > 4 && !commonWords.has(w.toLowerCase()))
            .map(w => w.replace(/[^a-zA-Z]/g, ''))
            .filter(w => w.length > 4)
            .slice(0, 6)
        return [...new Set(topics)]
    }

    const topics = summary?.topics?.length ? summary.topics : extractTopics(summary?.text)

    return (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Video Overview</h3>
                <div className="flex items-center gap-2">
                    {isReady && (
                        <span className="badge badge-success">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ready to query
                        </span>
                    )}
                    {isProcessing && (
                        <span className="badge badge-warning">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Processing...
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
                {/* Metadata */}
                <div className="flex items-center gap-6 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '~10 min'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{state.segmentCount || 0} segments</span>
                    </div>
                    {addedAt && (
                        <span className="text-zinc-500">
                            Added {new Date(addedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>

                {/* Summary */}
                {summary?.text ? (
                    <div>
                        <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Summary
                        </h4>
                        <p className="text-sm text-neutral-700 leading-relaxed">
                            {summary.text}
                        </p>
                    </div>
                ) : isProcessing ? (
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                            <span className="text-sm text-neutral-600">Summary will appear when transcript is ready...</span>
                        </div>
                    </div>
                ) : null}

                {/* Topics */}
                {topics.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Key Topics
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {topics.map((topic, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-3 pt-2">
                    <button className="bg-primary-600 hover:bg-primary-700 flex-1 px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all duration-200 shadow-sm">
                        Ask about this video
                    </button>
                    <button className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-4 py-2.5 rounded-xl text-sm text-neutral-700 hover:text-neutral-900 transition-all">
                        View Transcript
                    </button>
                </div>
            </div>
        </div>
    )
}

export default VideoOverview
