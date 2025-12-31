// ============================================
// KANTING API CONFIGURATION
// ============================================
// Replace with your Colab ngrok URL
export const API_URL = "";
// Example: export const API_URL = "https://abc123.ngrok-free.dev";
// ============================================

export const api = {
  async storeTranscript(videoUrl) {
    const response = await fetch(`${API_URL}/store-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl }),
    });
    return response.json();
  },

  async query(queryText) {
    const response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText }),
    });
    return response.json();
  },

  async getStats() {
    const response = await fetch(`${API_URL}/stats`);
    return response.json();
  },

  async healthCheck() {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },
};

export default api;
