import useStore from '../../store/useStore'
import VideoPlayer from './VideoPlayer'
import Timeline from './Timeline'
import VideoOverview from './VideoOverview'
import TranscriptCanvas from './TranscriptCanvas'
import { Video, Sparkles } from 'lucide-react'

function VideoWorkspace() {
    const { activeVideoId, videos } = useStore()
    const video = activeVideoId ? videos[activeVideoId] : null

    if (!video) {
        return <EmptyWorkspace />
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Video Player Section */}
            <div className="shrink-0">
                <VideoPlayer video={video} />
                <Timeline video={video} />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    <VideoOverview video={video} />
                    <TranscriptCanvas video={video} />
                </div>
            </div>
        </div>
    )
}

function EmptyWorkspace() {
    return (
        <div className="flex-1 flex flex-col p-8">
            <div className="max-w-2xl">
                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center mb-6 border border-gray-200">
                    <Video className="w-6 h-6 text-gray-400" />
                </div>
                <h2 className="text-2xl font-medium text-gray-900 mb-4 tracking-tight">
                    Select a video to get started
                </h2>
                <p className="text-xl text-gray-600 mb-12 font-light">
                    Add a video from the library or upload a new one to begin asking questions.
                </p>

                {/* Example Preview */}
                <div className="w-full">
                    <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-900 mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Example: What you'll see</span>
                        </div>

                        <div className="space-y-3 text-left">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="font-mono text-xs text-gray-500 shrink-0 mt-0.5 font-medium">2:34</span>
                                <p className="text-sm text-gray-700">
                                    "The transformer architecture consists of an encoder and decoder..."
                                </p>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="font-mono text-xs text-gray-500 shrink-0 mt-0.5 font-medium">5:12</span>
                                <p className="text-sm text-gray-700">
                                    "Attention mechanisms allow the model to focus on relevant parts..."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoWorkspace
