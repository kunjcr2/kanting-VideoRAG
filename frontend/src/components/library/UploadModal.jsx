import { useEffect, useRef, useState } from 'react'
import { X, Link as LinkIcon, Upload, Loader2 } from 'lucide-react'
import useStore from '../../store/useStore'
import api from '../../api'

function UploadModal({ onClose }) {
    const fileInputRef = useRef(null)
    const [url, setUrl] = useState('')
    const [folder, setFolder] = useState('default')
    const [folders, setFolders] = useState(['default'])
    const [loading, setLoading] = useState(false)
    const [dragging, setDragging] = useState(false)
    const { ingestVideo, ingestUploadedVideo, addToast } = useStore()

    useEffect(() => {
        api.getFolders()
            .then((availableFolders) => {
                if (availableFolders.length > 0) setFolders(availableFolders)
            })
            .catch(() => {})
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!url.trim()) return

        setLoading(true)
        onClose() // Close modal immediately, processing shows in sidebar
        await ingestVideo(url.trim(), folder.trim() || 'default')
    }

    const handleFiles = async (files) => {
        const file = files?.[0]
        if (!file) return
        const supportedExtension = /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name)
        if (!file.type.startsWith('video/') && !supportedExtension) {
            addToast({ message: 'Please choose a supported video file', type: 'error' })
            return
        }

        setLoading(true)
        onClose()
        await ingestUploadedVideo(file, folder.trim() || 'default')
    }

    const isValidYoutubeUrl = (url) => {
        return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url)
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
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
                    {/* Local file drop zone */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
                        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition-colors ${dragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-primary-300'}`}
                    >
                        <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                        <p className="text-neutral-700 text-sm mb-1 font-medium">
                            Drag and drop a video file here, or click to browse
                        </p>
                        <p className="text-neutral-500 text-xs">
                            MP4, WebM, MOV up to 500MB
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/avi,video/x-matroska"
                            className="hidden"
                            onChange={(e) => handleFiles(e.target.files)}
                        />
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

                        <label className="block text-sm font-medium text-neutral-700 mb-2 mt-4">
                            Folder
                        </label>
                        <input
                            type="text"
                            list="video-folders"
                            value={folder}
                            onChange={(e) => setFolder(e.target.value)}
                            placeholder="e.g. employee-training"
                            pattern="[A-Za-z0-9._ -]+"
                            className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-3 placeholder-neutral-400 text-neutral-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                        <datalist id="video-folders">
                            {folders.map((availableFolder) => (
                                <option key={availableFolder} value={availableFolder} />
                            ))}
                        </datalist>
                        <p className="text-xs text-neutral-500 mt-2">
                            Videos in the same folder are searched together.
                        </p>

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
            </div>
        </div>
    )
}

export default UploadModal
