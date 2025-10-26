from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json

from vector_store import VectorStore
from clip_manager import ClipManager
from video_downloader import VideoDownloader
from main import store_transcript, query_and_extract_clip, get_transcript

app = Flask(__name__)
CORS(app)

# Initialize components
vector_store = VectorStore()
clip_manager = ClipManager()
downloader = VideoDownloader("videos")  # Store videos in videos/ directory

@app.route('/store-transcript', methods=['POST'])
def store_transcript_endpoint():
    """Store video and its transcript"""
    data = request.get_json()
    
    video_url = data.get('video_url')
    
    if not video_url:
        return jsonify({"error": "video_url required"}), 400
        
    # Download video from URL
    try:
        video_name = f"video_{os.urandom(4).hex()}"  # Simple unique name
        video_path = downloader.download_video(video_url, video_name)
        if not video_path:
            return jsonify({"error": "Failed to download video"}), 400
        
        # Extract transcript from the downloaded video
        transcript = get_transcript(video_path)
        if not transcript:
            return jsonify({"error": "Failed to extract transcript from video"}), 400
            
        # Store transcript with downloaded video path
        result = store_transcript(transcript, video_path, vector_store)
        return jsonify(result), 201
            
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route('/query', methods=['POST'])
def query_endpoint():
    """Query and get clip"""
    data = request.get_json()
    query = data.get('query')
    
    if not query:
        return jsonify({"error": "Query required"}), 400
    
    try:
        result = query_and_extract_clip(query, vector_store, clip_manager)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stats', methods=['GET'])
def stats_endpoint():
    """Get storage statistics"""
    return jsonify(vector_store.get_stats())

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    print("🚀 RAG System Running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)