import { Sparkles, Upload, Wifi, WifiOff } from 'lucide-react'
import useStore from '../store/useStore'
import { useEffect, useState } from 'react'
import { API_URL } from '../api'

function StatusBar({ onUploadClick }) {
    const { stats, fetchStats, loadVideos } = useStore()
    const [connected, setConnected] = useState(false)
    const [now] = useState(() => Date.now())

    useEffect(() => {
        fetchStats()
        loadVideos()
        // Check connection
        const checkConnection = async () => {
            try {
                const res = await fetch(`${API_URL}/health`)
                setConnected(res.ok)
            } catch {
                setConnected(false)
            }
        }
        checkConnection()
        const interval = setInterval(checkConnection, 30000)
        return () => clearInterval(interval)
    }, [fetchStats, loadVideos])

    const formatTime = (date) => {
        if (!date) return 'never'
        const mins = Math.floor((now - new Date(date).getTime()) / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        return `${Math.floor(mins / 60)}h ago`
    }

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="font-medium tracking-tight text-xl text-gray-900">Kanting</span>
                    <span className="text-sm text-gray-500 font-light">看听</span>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-sm text-gray-600 font-light">
                    <span>
                        <span className="text-gray-900 font-medium">{stats.videoCount}</span> videos
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                        <span className="text-gray-900 font-medium">{stats.segmentCount}</span> segments
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">
                        indexed {formatTime(stats.lastIndexed)}
                    </span>
                </div>

                {/* Connection indicator */}
                <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-600' : 'text-red-600'}`}>
                    {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                    <span>{connected ? 'Connected' : 'Offline'}</span>
                </div>

                {/* Upload button */}
                <button
                    onClick={onUploadClick}
                    className="bg-gray-900 hover:bg-gray-800 flex items-center gap-2 px-4 py-2 rounded text-sm text-white font-medium transition-colors">
                    <Upload className="w-4 h-4" />
                    Add Video
                </button>
            </div>
        </header>
    )
}

export default StatusBar
