import useStore from '../../store/useStore'
import { useState } from 'react'

function Timeline({ video }) {
    const { timelineMarkers, currentTime, setCurrentTime } = useStore()
    const [hoveredMarker, setHoveredMarker] = useState(null)

    const duration = video?.duration || 600 // Default 10 min

    // Calculate position as percentage
    const getPosition = (time) => (time / duration) * 100

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percent = x / rect.width
        const time = percent * duration
        setCurrentTime(time)
    }

    return (
        <div className="bg-white border-b border-neutral-200 px-4 py-3">
            {/* Timeline Track */}
            <div
                className="relative h-8 bg-neutral-100 rounded-lg cursor-pointer overflow-hidden group border border-neutral-200"
                onClick={handleClick}
            >
                {/* Progress */}
                <div
                    className="absolute inset-y-0 left-0 bg-neutral-200"
                    style={{ width: `${getPosition(currentTime)}%` }}
                />

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary-600 shadow-lg z-20"
                    style={{ left: `${getPosition(currentTime)}%` }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-600 rounded-full shadow-md" />
                </div>

                {/* Markers */}
                {timelineMarkers.map((marker, idx) => (
                    <div
                        key={idx}
                        className="absolute top-1 bottom-1 w-1 rounded-full z-10 cursor-pointer transition-all hover:w-1.5"
                        style={{
                            left: `${getPosition(marker.time)}%`,
                            backgroundColor: marker.type === 'citation' ? '#2563eb' : '#0ea5e9'
                        }}
                        onMouseEnter={() => setHoveredMarker(marker)}
                        onMouseLeave={() => setHoveredMarker(null)}
                        onClick={(e) => {
                            e.stopPropagation()
                            setCurrentTime(marker.time)
                        }}
                    >
                        {/* Hover tooltip */}
                        {hoveredMarker === marker && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs whitespace-nowrap shadow-lg text-white">
                                <span className="font-mono text-primary-300">
                                    {Math.floor(marker.time / 60)}:{String(Math.floor(marker.time % 60)).padStart(2, '0')}
                                </span>
                                {marker.label && (
                                    <span className="text-neutral-300 ml-2">{marker.label}</span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Marker Legend */}
            {timelineMarkers.length > 0 && (
                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                        <span>Retrieved segments</span>
                    </div>
                    <span className="text-neutral-300">•</span>
                    <span>{timelineMarkers.length} moments found</span>
                </div>
            )}
        </div>
    )
}

export default Timeline
