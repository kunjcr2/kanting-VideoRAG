import { useState } from 'react'
import StatusBar from './StatusBar'
import VideoLibrary from './library/VideoLibrary'
import VideoWorkspace from './workspace/VideoWorkspace'
import QueryPanel from './evidence/QueryPanel'
import UploadModal from './library/UploadModal'
import ToastContainer from './ToastContainer'

function AppShell() {
    const [showUpload, setShowUpload] = useState(false)

    return (
        <div className="h-screen flex flex-col bg-white text-neutral-900 overflow-hidden">
            {/* Status Bar */}
            <StatusBar onUploadClick={() => setShowUpload(true)} />

            {/* Main 3-Panel Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Video Library */}
                <aside className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0">
                    <VideoLibrary onAddVideo={() => setShowUpload(true)} />
                </aside>

                {/* Center: Video Workspace */}
                <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                    <VideoWorkspace />
                </main>

                {/* Right: Evidence Rail */}
                <aside className="w-96 border-l border-gray-200 bg-white flex flex-col shrink-0">
                    <QueryPanel />
                </aside>
            </div>

            {/* Modals */}
            {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

            {/* Toasts */}
            <ToastContainer />
        </div>
    )
}

export default AppShell
