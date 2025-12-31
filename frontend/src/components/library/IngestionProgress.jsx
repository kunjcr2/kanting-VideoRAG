import { VIDEO_STATES } from '../../store/useStore'

const STEPS = [
    { key: VIDEO_STATES.UPLOADING, label: 'Uploading' },
    { key: VIDEO_STATES.TRANSCRIBING, label: 'Transcribing' },
    { key: VIDEO_STATES.SEGMENTING, label: 'Segmenting' },
    { key: VIDEO_STATES.INDEXING, label: 'Indexing' },
]

function IngestionProgress({ state, compact = false }) {
    const currentIndex = STEPS.findIndex(s => s.key === state.status)

    if (compact) {
        // Compact view for VideoCard
        return (
            <div className="mt-1.5">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                    <span>{STEPS[currentIndex]?.label || state.status}...</span>
                    <span className="text-neutral-500">{state.progress || 0}%</span>
                </div>
                <div className="mt-1 progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${state.progress || 0}%` }}
                    />
                </div>
            </div>
        )
    }

    // Full view for UploadModal
    return (
        <div className="space-y-3">
            {STEPS.map((step, idx) => {
                const isComplete = idx < currentIndex
                const isCurrent = idx === currentIndex
                const isPending = idx > currentIndex

                return (
                    <div key={step.key} className="flex items-center gap-3">
                        {/* Step indicator */}
                        <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
              ${isComplete ? 'bg-emerald-500 text-white' : ''}
              ${isCurrent ? 'bg-primary-600 text-white' : ''}
              ${isPending ? 'bg-neutral-200 text-neutral-500' : ''}
            `}>
                            {isComplete ? '✓' : idx + 1}
                        </div>

                        {/* Label + Progress */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${isCurrent ? 'text-neutral-900' : isPending ? 'text-neutral-500' : 'text-neutral-700'}`}>
                                    {step.label}
                                </span>
                                {isCurrent && (
                                    <span className="text-xs text-neutral-500 font-semibold">{state.progress || 0}%</span>
                                )}
                            </div>
                            {isCurrent && (
                                <div className="mt-1.5 progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${state.progress || 0}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default IngestionProgress
