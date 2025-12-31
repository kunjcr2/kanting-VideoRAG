from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from vector_store import VectorStore
from clip_manager import ClipManager
from video_downloader import VideoDownloader
from main import store_transcript, query_and_extract_clip, get_transcript

app = Flask(__name__)
CORS(app)

# Initialize components (use CPU for local, GPU on Colab)
device = "cuda" if os.environ.get("USE_GPU", "false").lower() == "true" else "cpu"
vector_store = VectorStore(device=device)
clip_manager = ClipManager()
downloader = VideoDownloader("videos")


@app.route('/store-transcript', methods=['POST'])
def store_transcript_endpoint():
    """
    Store video transcript and generate summary.
    
    Input: {"video_url": "https://youtube.com/watch?v=..."}
    Output: {"video_id": "...", "status": "success", "summary": "..."}
    """
    data = request.get_json()
    video_url = data.get('video_url')
    
    if not video_url:
        return jsonify({"error": "video_url required"}), 400
    
    try:
        # Download video
        video_name = f"video_{os.urandom(4).hex()}"
        video_path = downloader.download_video(video_url, video_name)
        
        if not video_path:
            return jsonify({"error": "Failed to download video"}), 400
        
        # Extract transcript using Whisper
        transcript = get_transcript(video_path)
        if not transcript:
            return jsonify({"error": "Failed to extract transcript"}), 400
        
        # Store transcript and generate summary
        result = store_transcript(transcript, video_path, video_url, vector_store)
        return jsonify(result), 201
        
    except Exception as e:
        return jsonify({"error": f"Error: {str(e)}"}), 500


@app.route('/query', methods=['POST'])
def query_endpoint():
    """
    Query videos and get AI-generated answer with timestamped link.
    
    Input: {"query": "What is the video about?"}
    Output: {"answer": "...", "video_url": "...?t=123", ...}
    """
    data = request.get_json()
    query = data.get('query')
    
    if not query:
        return jsonify({"error": "query required"}), 400
    
    try:
        result = query_and_extract_clip(query, vector_store, clip_manager)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/stats', methods=['GET'])
def stats_endpoint():
    """Get storage statistics."""
    return jsonify(vector_store.get_stats())


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})


if __name__ == '__main__':
    print("Kanting Video RAG System")
    print(f"   Device: {device}")
    print(f"   Running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)