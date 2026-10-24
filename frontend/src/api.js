// ============================================
// KANTING API CONFIGURATION
// ============================================
// Replace with your Colab ngrok URL
export const API_URL = import.meta.env.VITE_API_URL || "";

async function requestJson(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.text();
  let data = {};
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Backend returned an invalid response (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(data.error || `Backend request failed (${response.status})`);
  }
  return data;
}
// ============================================

export const api = {
  async storeTranscript(videoUrl, folder = 'default') {
    return requestJson('/store-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl, folder }),
    });
  },

  async uploadVideo(file, folder = 'default') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return requestJson('/upload-video', { method: 'POST', body: formData });
  },

  async query(queryText, folder = 'default') {
    return requestJson('/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText, folder }),
    });
  },

  async getStats() {
    return requestJson('/stats');
  },

  async getVideos() {
    return requestJson('/videos');
  },

  async getFolders() {
    return requestJson('/folders');
  },

  async healthCheck() {
    return requestJson('/health');
  },
};

export default api;
