import { useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { FileText } from 'lucide-react'

function TranscriptCanvas({ video }) {
    const { currentTime, setCurrentTime, highlightedSegments } = useStore()
    const containerRef = useRef(null)
    const activeSegmentRef = useRef(null)

    const transcript = video?.transcript || []

    // Check if a segment is highlighted (from query results)
    const isHighlighted = (segment) => {
        return highlightedSegments.some(
            hs => segment.start >= hs.start && segment.start <= hs.end
        )
    }

    // Check if a segment is currently playing
    const isActive = (segment) => {
        return currentTime >= segment.start && currentTime < segment.end
    }

    // Auto-scroll to active segment
    useEffect(() => {
        if (activeSegmentRef.current && containerRef.current) {
            activeSegmentRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            })
        }
    }, [currentTime])

    const handleSegmentClick = (segment) => {
        setCurrentTime(segment.start)
    }

    // Format timestamp
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transcript
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                    Click to jump to moment
                </span>
            </div>

            {/* Transcript Content */}
            <div
                ref={containerRef}
                className="max-h-96 overflow-y-auto p-4 space-y-1"
            >
                {transcript.length === 0 ? (
                    <p className="p-4 text-sm text-neutral-500">No transcript is available yet.</p>
                ) : transcript.map((segment) => {
                    const active = isActive(segment)
                    const highlighted = isHighlighted(segment)

                    return (
                        <div
                            key={segment.id}
                            ref={active ? activeSegmentRef : null}
                            onClick={() => handleSegmentClick(segment)}
                            className={`
                flex gap-3 p-3 rounded-lg cursor-pointer transition-all
                ${active
                                    ? 'bg-primary-50 border border-primary-200'
                                    : highlighted
                                        ? 'bg-primary-100/50 border border-primary-200'
                                        : 'hover:bg-neutral-50 border border-transparent'
                                }
              `}
                        >
                            {/* Timestamp */}
                            <span className={`
                font-mono text-xs shrink-0 mt-0.5 font-semibold
                ${active ? 'text-primary-600' : highlighted ? 'text-primary-600' : 'text-neutral-500'}
              `}>
                                {formatTime(segment.start)}
                            </span>

                            {/* Text */}
                            <p className={`
                text-sm leading-relaxed
                ${active ? 'text-neutral-900 font-medium' : highlighted ? 'text-neutral-800' : 'text-neutral-700'}
              `}>
                                {segment.text}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default TranscriptCanvas
