import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react'
import useStore, { VIDEO_STATES } from '../../store/useStore'

function VideoPlayer({ video }) {
    const { currentTime } = useStore()
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [duration] = useState(0)
    const playerRef = useRef(null)

    // Extract YouTube video ID
    const getVideoId = (url) => {
        if (!url) return null
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
        return match ? match[1].split('?')[0].split('&')[0] : null
    }

    const videoId = getVideoId(video.youtubeUrl)
    const isLocalVideo = video.youtubeUrl?.startsWith('/media/') || video.youtubeUrl?.startsWith('blob:')

    // React state changes do not automatically seek a native HTML5 video.
    // Apply the timestamp whenever a transcript/evidence Jump action updates it.
    useEffect(() => {
        if (isLocalVideo && playerRef.current && Number.isFinite(currentTime)) {
            playerRef.current.currentTime = currentTime
        }
    }, [currentTime, isLocalVideo, video.youtubeUrl])
    const isProcessing = [
        VIDEO_STATES.UPLOADING,
        VIDEO_STATES.TRANSCRIBING,
        VIDEO_STATES.SEGMENTING,
        VIDEO_STATES.INDEXING,
    ].includes(video.state.status)

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-black relative border-b border-neutral-200">
            {/* Video Embed */}
            <div className="aspect-video">
                {isLocalVideo ? (
                    <video
                        ref={playerRef}
                        className="w-full h-full object-contain"
                        src={video.youtubeUrl}
                        controls
                        preload="metadata"
                    />
                ) : videoId ? (
                    <iframe
                        ref={playerRef}
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&start=${Math.floor(currentTime)}`}
                        title="Video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                        <p className="text-neutral-500">No video available</p>
                    </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-neutral-950/95 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 border-2 border-neutral-700 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white font-medium">Processing video...</p>
                            <p className="text-xs text-neutral-400 mt-1">
                                {video.state.status} • {video.state.progress || 0}%
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Controls Bar */}
            <div className="bg-white border-t border-neutral-200 px-4 py-2 flex items-center gap-4">
                {/* Play/Pause */}
                <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                        <SkipBack className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                        className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                        onClick={() => setPlaying(!playing)}
                    >
                        {playing ? (
                            <Pause className="w-4 h-4 text-neutral-900" />
                        ) : (
                            <Play className="w-4 h-4 text-neutral-900 ml-0.5" />
                        )}
                    </button>
                    <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                        <SkipForward className="w-4 h-4 text-neutral-600" />
                    </button>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-neutral-900 font-medium">{formatTime(currentTime)}</span>
                    <span className="text-neutral-400">/</span>
                    <span className="font-mono text-neutral-600">{formatTime(duration || 600)}</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Volume */}
                <button
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setMuted(!muted)}
                >
                    {muted ? (
                        <VolumeX className="w-4 h-4 text-neutral-600" />
                    ) : (
                        <Volume2 className="w-4 h-4 text-neutral-600" />
                    )}
                </button>

                {/* Fullscreen */}
                <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                    <Maximize className="w-4 h-4 text-neutral-600" />
                </button>
            </div>
        </div>
    )
}

export default VideoPlayer
