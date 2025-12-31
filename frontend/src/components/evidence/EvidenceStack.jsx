import { Layers } from 'lucide-react'
import EvidenceCard from './EvidenceCard'

function EvidenceStack({ evidence }) {
    if (!evidence || evidence.length === 0) return null

    return (
        <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-neutral-500" />
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                    Retrieved Segments ({evidence.length})
                </h4>
            </div>

            <div className="space-y-2">
                {evidence.map((segment, idx) => (
                    <EvidenceCard key={segment.id || idx} segment={segment} index={idx} />
                ))}
            </div>
        </div>
    )
}

export default EvidenceStack
