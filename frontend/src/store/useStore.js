import { create } from 'zustand'
import api from '../api'

// Video ingestion states
export const VIDEO_STATES = {
  UPLOADING: 'uploading',
  TRANSCRIBING: 'transcribing',
  SEGMENTING: 'segmenting',
  INDEXING: 'indexing',
  READY: 'ready',
  ERROR: 'error',
}

const useStore = create((set, get) => ({
  // ============ VIDEOS ============
  videos: {},
  activeVideoId: null,
  
  addVideo: (video) => set((state) => ({
    videos: { ...state.videos, [video.id]: video }
  })),
  
  updateVideo: (id, updates) => set((state) => ({
    videos: {
      ...state.videos,
      [id]: { ...state.videos[id], ...updates }
    }
  })),
  
  setActiveVideo: (id) => set({ activeVideoId: id }),
  
  getActiveVideo: () => {
    const { videos, activeVideoId } = get()
    return activeVideoId ? videos[activeVideoId] : null
  },
  
  // ============ QUERIES ============
  queries: [],
  activeQueryId: null,
  
  addQuery: (query) => set((state) => ({
    queries: [...state.queries, query],
    activeQueryId: query.id
  })),
  
  updateQuery: (id, updates) => set((state) => ({
    queries: state.queries.map(q => 
      q.id === id ? { ...q, ...updates } : q
    )
  })),
  
  clearQueries: () => set({ queries: [], activeQueryId: null }),
  
  // ============ GLOBAL STATS ============
  stats: {
    videoCount: 0,
    segmentCount: 0,
    lastIndexed: null,
  },
  
  fetchStats: async () => {
    try {
      const data = await api.getStats()
      set({
        stats: {
          videoCount: data.videos || 0,
          segmentCount: data.segments || 0,
          lastIndexed: new Date(),
        }
      })
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    }
  },
  
  // ============ UI STATE ============
  currentTime: 0, // Video playback time
  setCurrentTime: (time) => set({ currentTime: time }),
  
  highlightedSegments: [], // Segments to highlight in transcript
  setHighlightedSegments: (segments) => set({ highlightedSegments: segments }),
  
  timelineMarkers: [], // Markers on the timeline
  setTimelineMarkers: (markers) => set({ timelineMarkers: markers }),
  
  // ============ TOAST NOTIFICATIONS ============
  toasts: [],
  
  addToast: (toast) => {
    const id = Date.now()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    }, 4000)
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  
  // ============ ACTIONS ============
  
  // Ingest a video (handles the full flow)
  ingestVideo: async (youtubeUrl) => {
    const id = `video_${Date.now()}`
    const { addVideo, updateVideo, fetchStats, addToast } = get()
    
    // Add video in uploading state
    addVideo({
      id,
      title: 'Loading...',
      youtubeUrl,
      thumbnailUrl: null,
      duration: 0,
      state: { status: VIDEO_STATES.UPLOADING, progress: 0 },
      summary: null,
      transcript: null,
      segments: [],
      addedAt: new Date(),
    })
    
    // Simulate upload progress (in reality this would be actual upload)
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 200))
      updateVideo(id, { state: { status: VIDEO_STATES.UPLOADING, progress: i } })
    }
    
    // Transition to transcribing
    updateVideo(id, { state: { status: VIDEO_STATES.TRANSCRIBING, progress: 0 } })
    
    try {
      // Call the actual API
      const result = await api.storeTranscript(youtubeUrl)
      
      if (result.error) {
        updateVideo(id, { 
          state: { status: VIDEO_STATES.ERROR, message: result.error } 
        })
        addToast({ message: result.error, type: 'error' })
        return
      }
      
      // Extract video title from URL or use video_id
      const videoTitle = result.video_id || 'Video'
      
      // Update with summary (transcript is ready)
      updateVideo(id, {
        title: videoTitle,
        state: { status: VIDEO_STATES.SEGMENTING, progress: 50 },
        summary: result.summary ? {
          text: result.summary,
          bullets: result.summary.split('. ').filter(s => s.length > 10).slice(0, 5),
          topics: [], // Would be extracted from summary
        } : null,
      })
      
      // Simulate segmenting
      await new Promise(r => setTimeout(r, 500))
      updateVideo(id, { state: { status: VIDEO_STATES.INDEXING, progress: 80 } })
      
      // Done!
      await new Promise(r => setTimeout(r, 500))
      updateVideo(id, { 
        state: { status: VIDEO_STATES.READY, segmentCount: 0 }
      })
      
      addToast({ message: `"${videoTitle}" ready to query`, type: 'success' })
      fetchStats()
      
    } catch (e) {
      updateVideo(id, { 
        state: { status: VIDEO_STATES.ERROR, message: e.message } 
      })
      addToast({ message: 'Failed to process video', type: 'error' })
    }
  },
  
  // Query the active video
  queryVideo: async (questionText) => {
    const { addQuery, updateQuery, setHighlightedSegments, setTimelineMarkers, addToast } = get()
    
    const queryId = `query_${Date.now()}`
    
    addQuery({
      id: queryId,
      text: questionText,
      timestamp: new Date(),
      loading: true,
      answer: null,
      evidence: [],
    })
    
    try {
      const result = await api.query(questionText)
      
      if (result.error) {
        updateQuery(queryId, { loading: false, error: result.error })
        addToast({ message: result.error, type: 'error' })
        return
      }
      
      // Parse citations from answer
      const citations = []
      if (result.timestamp !== undefined) {
        citations.push({
          timestamp: result.timestamp,
          text: result.answer?.slice(0, 100) + '...',
        })
      }
      
      updateQuery(queryId, {
        loading: false,
        answer: {
          text: result.answer,
          citations,
          videoUrl: result.video_url,
        },
        evidence: result.segments_used ? Array(result.segments_used).fill({}).map((_, i) => ({
          id: `seg_${i}`,
          timestamp: result.timestamp || 0,
          text: 'Retrieved segment',
        })) : [],
      })
      
      // Update timeline markers
      if (result.timestamp !== undefined) {
        setTimelineMarkers([{ time: result.timestamp, type: 'citation' }])
        setHighlightedSegments([{ start: result.timestamp, end: result.timestamp + 30 }])
      }
      
    } catch (e) {
      updateQuery(queryId, { loading: false, error: e.message })
      addToast({ message: 'Query failed', type: 'error' })
    }
  },
}))

export default useStore
