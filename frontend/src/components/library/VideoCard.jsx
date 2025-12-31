import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { VIDEO_STATES } from '../../store/useStore'
import IngestionProgress from './IngestionProgress'

function VideoCard({ video, isActive, onClick }) {
    const { state, title, youtubeUrl, addedAt } = video
    const isProcessing = [
        VIDEO_STATES.UPLOADING,
        VIDEO_STATES.TRANSCRIBING,
        VIDEO_STATES.SEGMENTING,
        VIDEO_STATES.INDEXING,
    ].includes(state.status)

    const isReady = state.status === VIDEO_STATES.READY
    const isError = state.status === VIDEO_STATES.ERROR

    // Extract video ID for thumbnail
    const getYoutubeThumbnail = (url) => {
        const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
        if (match) {
            return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
        }
        return null
    }

    const thumbnail = getYoutubeThumbnail(youtubeUrl)

    return (
        <div
            onClick={onClick}
            className={`
        rounded overflow-hidden cursor-pointer transition-all
        ${isActive
                    ? 'bg-gray-50 border-gray-300 shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }
        border card-shadow hover-lift
      `}
        >
            {/* Thumbnail */}
            {thumbnail && (
                <div className="aspect-video bg-neutral-100 relative">
                    <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                    {/* Processing overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                        </div>
                    )}
                </div>
            )}

            {/* Info */}
            <div className="p-3">
                <div className="flex items-start gap-2">
                    {/* Status indicator */}
                    <div className="mt-0.5">
                        {isReady && <div className="status-dot status-dot-success" />}
                        {isError && <div className="status-dot status-dot-error" />}
                        {isProcessing && <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {title}
                        </p>

                        {isReady && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {state.segmentCount || 0} segments • ready
                            </p>
                        )}

                        {isProcessing && (
                            <IngestionProgress state={state} compact />
                        )}

                        {isError && (
                            <p className="text-xs text-red-600 mt-0.5">
                                {state.message || 'Processing failed'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoCard
