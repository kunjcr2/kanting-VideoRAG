from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename

from folder_store import FolderVectorStore
from clip_manager import ClipManager
from video_downloader import VideoDownloader
from main import store_transcript, query_and_extract_clip, get_transcript

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_UPLOAD_MB", "500")) * 1024 * 1024

# Initialize components (use CPU for local, GPU on Colab)
device = "cuda" if os.environ.get("USE_GPU", "false").lower() == "true" else os.getenv("EMBEDDING_DEVICE", "cpu")
vector_store = FolderVectorStore(
    root_dir=os.getenv("VECTOR_STORE_DIR", "vector_data"),
    device=device,
)
clip_manager = ClipManager()
downloader = VideoDownloader(os.getenv("VIDEO_DIR", "videos"))


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
        folder = vector_store.normalize_folder(data.get("folder", "default"))
        video_path = downloader.download_video(video_url, video_name)
        
        if not video_path:
            return jsonify({
                "error": downloader.last_error or "Failed to download video"
            }), 400
        
        # Extract transcript using Whisper
        transcript = get_transcript(video_path)
        if not transcript:
            return jsonify({"error": "Local Whisper could not detect speech in this video"}), 422
        
        # Store transcript and generate summary
        result = store_transcript(transcript, video_path, video_url, vector_store.get_store(folder))
        result["folder"] = folder
        return jsonify(result), 201
        
    except Exception as e:
        return jsonify({"error": f"Error: {str(e)}"}), 500


@app.route('/upload-video', methods=['POST'])
def upload_video_endpoint():
    """Save and index a locally uploaded video file."""
    uploaded_file = request.files.get('file')
    if not uploaded_file or not uploaded_file.filename:
        return jsonify({"error": "video file required"}), 400

    extension = os.path.splitext(uploaded_file.filename)[1].lower()
    allowed_extensions = {".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"}
    if extension not in allowed_extensions:
        return jsonify({"error": "Supported video types: MP4, WebM, MOV, M4V, AVI, MKV"}), 415

    folder = vector_store.normalize_folder(request.form.get("folder", "default"))
    safe_name = secure_filename(uploaded_file.filename) or "video"
    filename = f"upload_{uuid.uuid4().hex[:8]}_{safe_name}"
    video_path = os.path.join(downloader.download_dir, filename)

    try:
        uploaded_file.save(video_path)
        transcript = get_transcript(video_path)
        if not transcript:
            return jsonify({"error": "Local Whisper could not detect speech in this video"}), 422

        source_url = f"/media/{filename}"
        result = store_transcript(
            transcript,
            video_path,
            source_url,
            vector_store.get_store(folder),
        )
        result["folder"] = folder
        result["video_url"] = source_url
        result["filename"] = safe_name
        return jsonify(result), 201
    except Exception as e:
        try:
            os.remove(video_path)
        except OSError:
            pass
        return jsonify({"error": f"Error processing uploaded video: {str(e)}"}), 500


@app.route('/media/<path:filename>', methods=['GET'])
def media_endpoint(filename):
    """Stream uploaded local videos to the local video player."""
    return send_from_directory(os.path.abspath(downloader.download_dir), filename)


@app.route('/query', methods=['POST'])
def query_endpoint():
    """
    Query videos and get AI-generated answer with timestamped link.
    
    Input: {"query": "What is the video about?"}
    Output: {"answer": "...", "video_url": "...?t=123", ...}
    """
    data = request.get_json()
    query = data.get('query')
    folder = vector_store.normalize_folder(data.get("folder", "default"))
    
    if not query:
        return jsonify({"error": "query required"}), 400
    
    try:
        result = query_and_extract_clip(query, vector_store.get_store(folder), clip_manager)
        result["folder"] = folder
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/stats', methods=['GET'])
def stats_endpoint():
    """Get storage statistics."""
    return jsonify(vector_store.get_stats())


@app.route('/videos', methods=['GET'])
def videos_endpoint():
    """Return indexed videos and their real local Whisper transcript segments."""
    return jsonify(vector_store.get_videos())


@app.route('/folders', methods=['GET'])
def folders_endpoint():
    """Return available video folders."""
    return jsonify(vector_store.list_folders())


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})


if __name__ == '__main__':
    print("Kanting Video RAG System")
    print(f"   Device: {device}")
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "5000"))
    print(f"   Running on http://{host}:{port}")
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true", host=host, port=port)
