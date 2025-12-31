# Kanting

A Video RAG (Retrieval Augmented Generation) system that enables intelligent video content search and retrieval. Upload videos, automatically extract and index transcripts, then query your video library using natural language to get relevant clips and AI-generated answers.

## Features

- **Video Ingestion**: Download YouTube videos and extract transcripts using OpenAI Whisper (GPU)
- **Semantic Search**: Store transcripts in FAISS vector database for efficient similarity search
- **AI-Powered Answers**: Get context-aware responses from GPT-4o-mini using retrieved video content
- **Summary Generation**: Auto-generate brief summaries that provide context for all queries
- **Timestamped Results**: Receive direct YouTube links with timestamps (e.g., `?t=125`)

## Tech Stack

- **Backend**: Flask with CORS
- **Speech-to-Text**: OpenAI Whisper (medium model, GPU)
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Store**: FAISS
- **LLM**: OpenAI GPT-4o-mini
- **Video Processing**: yt-dlp for downloads

## Quick Start (Google Colab)

1. Open `kanting_colab.ipynb` in Google Colab
2. Set your `OPENAI_API_KEY` and `NGROK_AUTH_TOKEN`
3. Run all cells
4. Use the public ngrok URL to access the API

## API Endpoints

### Store Video Transcript
```http
POST /store-transcript
Content-Type: application/json

{"video_url": "https://youtube.com/watch?v=..."}
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

{"query": "What did they say about machine learning?"}
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
│   ├── llm_client.py      # OpenAI GPT-4o-mini client
│   ├── vector_store.py    # FAISS vector database
│   ├── clip_manager.py    # Clip boundary utilities
│   └── video_downloader.py # YouTube download handler
├── kanting_colab.ipynb    # Google Colab notebook
├── requirements.txt
├── .env.example
└── README.md
```

## How It Works

1. **Video Ingestion**: Submit a YouTube URL → Download video → Extract transcript with Whisper
2. **Summarization**: Generate a 2-3 sentence summary using GPT-4o-mini
3. **Indexing**: Chunk transcript → Embed with Sentence Transformers → Store in FAISS
4. **Query**: User question → Search FAISS → Get relevant chunks
5. **Response**: Pass summary + chunks to GPT → Return answer + timestamped URL

## Requirements

- Python 3.10+
- CUDA-compatible GPU (for Whisper)
- OpenAI API key
- FFmpeg (for video processing)

## License

MIT License
