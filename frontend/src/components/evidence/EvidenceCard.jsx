import { Play, FileText, ExternalLink } from 'lucide-react'
import useStore from '../../store/useStore'

function EvidenceCard({ segment, index }) {
    const { setActiveVideo, setCurrentTime, setHighlightedSegments } = useStore()

    // Format timestamp
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleJump = () => {
        if (segment.video_id) setActiveVideo(segment.video_id)
        setCurrentTime(segment.timestamp ?? segment.start ?? 0)
    }

    const handleHighlight = () => {
        if (segment.start !== undefined && segment.end !== undefined) {
            setHighlightedSegments([{ start: segment.start, end: segment.end }])
        }
    }

    return (
        <div
            className="bg-white border border-neutral-200 rounded-xl p-3 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
            onMouseEnter={handleHighlight}
        >
            <div className="flex items-start gap-3">
                {/* Index Badge */}
                <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 border border-primary-200">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-primary-600 font-semibold">
                            {formatTime(segment.timestamp ?? segment.start ?? 0)}
                        </span>
                        {segment.confidence && (
                            <span className="text-xs text-neutral-500">
                                {Math.round(segment.confidence * 100)}% match
                            </span>
                        )}
                    </div>

                    {/* Text */}
                    <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">
                        {segment.text || 'Retrieved segment content'}
                    </p>

                    {/* Rationale */}
                    {segment.rationale && (
                        <p className="text-xs text-neutral-500 mt-1 italic">
                            {segment.rationale}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-200">
                <button
                    onClick={handleJump}
                    className="bg-primary-600 hover:bg-primary-700 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white font-medium transition-all duration-200"
                >
                    <Play className="w-3 h-3" />
                    Jump
                </button>
                <button className="bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 hover:text-neutral-900 transition-all">
                    <FileText className="w-3 h-3" />
                    Transcript
                </button>
            </div>
        </div>
    )
}

export default EvidenceCard
