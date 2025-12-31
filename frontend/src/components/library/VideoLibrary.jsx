import { Plus, Video } from 'lucide-react'
import useStore from '../../store/useStore'
import VideoCard from './VideoCard'
import IngestionProgress from './IngestionProgress'

function VideoLibrary({ onAddVideo }) {
    const { videos, activeVideoId, setActiveVideo } = useStore()
    const videoList = Object.values(videos)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    Video Library
                </h2>
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {videoList.length === 0 ? (
                    // Empty State
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center mb-4 border border-gray-200">
                            <Video className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-4 font-light">
                            No videos yet
                        </p>
                        <button
                            onClick={onAddVideo}
                            className="bg-gray-900 hover:bg-gray-800 flex items-center gap-2 px-4 py-2 rounded text-sm text-white font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add your first video
                        </button>
                    </div>
                ) : (
                    videoList.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            isActive={video.id === activeVideoId}
                            onClick={() => setActiveVideo(video.id)}
                        />
                    ))
                )}
            </div>

            {/* Add Video Button (when videos exist) */}
            {videoList.length > 0 && (
                <div className="p-2 border-t border-gray-200">
                    <button
                        onClick={onAddVideo}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Video
                    </button>
                </div>
            )}
        </div>
    )
}

export default VideoLibrary
