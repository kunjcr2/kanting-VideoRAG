import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Link as LinkIcon, Upload, Loader2 } from 'lucide-react'
import useStore from '../../store/useStore'

function UploadModal({ onClose }) {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const { ingestVideo } = useStore()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!url.trim()) return

        setLoading(true)
        onClose() // Close modal immediately, processing shows in sidebar
        await ingestVideo(url.trim())
    }

    const isValidYoutubeUrl = (url) => {
        return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
                    <h2 className="text-lg font-semibold text-neutral-900">Add Video</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Drop zone placeholder */}
                    <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 mb-6 text-center bg-neutral-50 hover:bg-neutral-100 hover:border-primary-300 transition-colors">
                        <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                        <p className="text-neutral-700 text-sm mb-1 font-medium">
                            Drag and drop video file
                        </p>
                        <p className="text-neutral-500 text-xs">
                            MP4, WebM, MOV up to 500MB
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-neutral-200" />
                        <span className="text-xs text-neutral-500 uppercase font-medium">or</span>
                        <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    {/* URL Input */}
                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            YouTube URL
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-white border border-neutral-300 rounded-xl pl-11 pr-4 py-3 placeholder-neutral-400 text-neutral-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                            />
                        </div>

                        {url && !isValidYoutubeUrl(url) && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                <span>⚠️</span> Please enter a valid YouTube URL
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!url.trim() || !isValidYoutubeUrl(url) || loading}
                            className="bg-primary-600 hover:bg-primary-700 w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Add Video
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-neutral-500 text-center mt-4">
                        Video will be transcribed, segmented, and indexed automatically
                    </p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default UploadModal
