import { useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { FileText } from 'lucide-react'

function TranscriptCanvas({ video }) {
    const { currentTime, setCurrentTime, highlightedSegments } = useStore()
    const containerRef = useRef(null)
    const activeSegmentRef = useRef(null)

    // Mock transcript segments (in real app, would come from video.transcript)
    const mockTranscript = [
        { id: 1, start: 0, end: 30, text: "Welcome to this video. Today we're going to explore some fascinating concepts in artificial intelligence and machine learning." },
        { id: 2, start: 30, end: 60, text: "The transformer architecture has revolutionized the field of natural language processing since its introduction in 2017." },
        { id: 3, start: 60, end: 90, text: "At its core, the transformer uses something called self-attention, which allows it to look at all parts of the input simultaneously." },
        { id: 4, start: 90, end: 120, text: "This is different from previous models like RNNs and LSTMs, which processed sequences one element at a time." },
        { id: 5, start: 120, end: 150, text: "The encoder takes the input sequence and creates a rich representation that captures the meaning and relationships between words." },
        { id: 6, start: 150, end: 180, text: "The decoder then uses this encoded representation to generate the output, one token at a time." },
        { id: 7, start: 180, end: 210, text: "Attention mechanisms are the key innovation. They allow the model to focus on relevant parts of the input when producing each output." },
        { id: 8, start: 210, end: 240, text: "This attention is learned during training, so the model discovers what information is important for each task." },
    ]

    const transcript = video?.transcript || mockTranscript

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
                {transcript.map((segment) => {
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
