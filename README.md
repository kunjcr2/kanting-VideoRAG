# Kanting

A Video RAG (Retrieval Augmented Generation) system that enables intelligent video content search and retrieval. Upload videos, automatically extract and index transcripts, then query your video library using natural language to get relevant clips and AI-generated answers.

## Features

- **Video Ingestion**: Download YouTube videos and extract transcripts using local Whisper
- **Semantic Search**: Store transcripts in FAISS vector database for efficient similarity search
- **AI-Powered Answers**: Get context-aware responses from a local Ollama model using retrieved video content
- **Summary Generation**: Auto-generate brief summaries that provide context for all queries
- **Timestamped Results**: Receive direct YouTube links with timestamps (e.g., `?t=125`)

## Tech Stack

- **Backend**: Flask with CORS
- **Speech-to-Text**: Local `openai-whisper` (`WHISPER_MODEL`, default `base`)
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Store**: FAISS
- **LLM**: Ollama running locally
- **Video Processing**: yt-dlp for downloads

## Quick Start (Google Colab)

1. Open `kanting_colab.ipynb` in Google Colab
2. Start Ollama and download a model, for example `ollama pull llama3.2`
3. Run all cells
4. Use the public ngrok URL to access the API

## API Endpoints

### Store Video Transcript
```http
POST /store-transcript
Content-Type: application/json

{"video_url": "https://youtube.com/watch?v=...", "folder": "employee-training"}
```

**Response:**
```json
{
  "video_id": "video_abc123",
  "status": "success",
  "summary": "Brief AI-generated summary..."
}
```

### Query Videos
```http
POST /query
Content-Type: application/json

{"query": "What did they say about machine learning?", "folder": "employee-training"}
```

**Response:**
```json
{
  "answer": "AI-generated response...",
  "video_url": "https://youtube.com/watch?v=...&t=125",
  "timestamp": 125,
  "segments_used": 3
}
```

### Get Statistics
```http
GET /stats
```

### List Folders

```http
GET /folders
```

Each folder is an isolated FAISS vector store under `VECTOR_STORE_DIR/<folder>`. A query searches only the selected folder. The web app automatically sends the active video's folder with every query, so videos in other folders cannot contribute evidence.

### Health Check
```http
GET /health
```

## Project Structure

```
kanting/
├── api/
│   ├── index.py           # Flask API endpoints
│   ├── main.py            # Core transcript/query logic
│   ├── llm_client.py      # Local Ollama client
│   ├── vector_store.py    # One FAISS store for one folder
│   ├── folder_store.py    # Folder-to-vector-store manager
│   ├── clip_manager.py    # Clip boundary utilities
│   └── video_downloader.py # YouTube download handler
├── kanting_colab.ipynb    # Google Colab notebook
├── requirements.txt
├── .env.example
└── README.md
```

## How It Works

1. **Video Ingestion**: Submit a YouTube URL → Download video → Extract transcript with Whisper
2. **Summarization**: Generate a 2-3 sentence summary using Ollama
3. **Indexing**: Chunk transcript → Embed with Sentence Transformers → Store in FAISS
4. **Query**: User question → Search only the active video's folder → Get relevant chunks
5. **Response**: Pass summary + chunks to local Ollama → Return answer + timestamped URL

## Requirements

- Python 3.10+
- CPU or CUDA-compatible GPU (CPU is the default)
- Ollama with a local chat model (default: `llama3.2:latest`)
- FFmpeg (for video processing)

## License

MIT License
