"""
Main Module for Kanting Video RAG

Handles:
- Video transcript extraction (Whisper)
- Summary generation (local Ollama)
- Query and response generation
"""

import os
import threading
from typing import Dict, List
import whisper
import torch

from vector_store import VectorStore
from clip_manager import ClipManager
from llm_client import generate_summary, generate_response

_whisper_model = None
_whisper_lock = threading.Lock()


def transcript_segments(transcript: str) -> List[Dict]:
    """Convert the persisted timestamped transcript into UI/API segments."""
    segments = []
    for index, line in enumerate(transcript.strip().splitlines()):
        parts = line.rsplit(',', 2)
        if len(parts) != 3:
            continue
        try:
            text, start, end = parts[0].strip(), float(parts[1]), float(parts[2])
        except ValueError:
            continue
        if text:
            segments.append({"id": index, "text": text, "start": start, "end": end})
    return segments


def get_transcript(video_path: str) -> str:
    """
    Extract transcript from video using Whisper on GPU.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Transcript in format: "text,start,end\ntext,start,end\n..."
        Returns None if extraction fails
    """
    try:
        # Use GPU if available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading Whisper model on {device}...")
        
        global _whisper_model
        model_name = os.getenv("WHISPER_MODEL", "base")
        with _whisper_lock:
            if _whisper_model is None:
                _whisper_model = whisper.load_model(model_name, device=device)
        model = _whisper_model
        
        print(f"Transcribing video: {video_path}")
        result = model.transcribe(
            video_path,
            verbose=False,
            word_timestamps=False,
            fp16=device == "cuda",
        )
        
        # Format as "text,start,end"
        transcript_lines = []
        for segment in result['segments']:
            text = segment['text'].strip().replace('\n', ' ')
            start = segment['start']
            end = segment['end']
            transcript_lines.append(f"{text},{start:.2f},{end:.2f}")
        
        transcript = "\n".join(transcript_lines)
        print(f"Transcribed {len(transcript_lines)} segments")
        
        return transcript if transcript else None
        
    except Exception as e:
        print(f"Error extracting transcript: {str(e)}")
        return None


def store_transcript(
    transcript: str, 
    video_path: str, 
    video_url: str, 
    vector_store: VectorStore
) -> Dict:
    """
    Store transcript in vector store and generate summary.
    
    Args:
        transcript: Raw transcript with timestamps
        video_path: Local path to video file
        video_url: Original YouTube URL
        vector_store: VectorStore instance
        
    Returns:
        Dict with video_id, status, and summary
    """
    # Generate summary using local Ollama
    print("Generating summary...")
    summary = generate_summary(transcript)
    print(f"Summary: {summary[:100]}...")
    
    # Add to vector store with summary
    video_id = vector_store.add_video(
        video_url=video_url,
        transcript=transcript,
        video_path=video_path,
        summary=summary
    )
    
    return {
        "video_id": video_id,
        "status": "success",
        "summary": summary
        ,"transcript": transcript_segments(transcript),
        "segment_count": len(transcript_segments(transcript)),
    }


def query_and_extract_clip(
    query: str,
    vector_store: VectorStore,
    clip_manager: ClipManager,
    top_k: int = 10
) -> Dict:
    """
    Query vector store and return answer with video URL + timestamp.
    
    Args:
        query: User's question
        vector_store: VectorStore instance
        clip_manager: ClipManager instance
        top_k: Number of segments to retrieve
        
    Returns:
        Dict with answer, video URL with timestamp, etc.
    """
    print(f"Searching for: '{query}'")
    
    # Retrieve a wider candidate pool before grouping by video. Searching only
    # the first 10 FAISS hits can hide a strong match from another video in the
    # same folder when one video contains many similar transcript lines.
    candidate_count = max(top_k, int(os.getenv("RETRIEVAL_CANDIDATES", "50")))
    segments = vector_store.search(query, top_k=candidate_count)
    
    if not segments:
        return {
            "answer": "No relevant content found. Please add some videos first.",
            "video_url": None,
            "error": "No segments found"
        }
    
    # Group segments by video and pick the best one
    video_groups = {}
    for seg in segments:
        vid = seg["video_id"]
        if vid not in video_groups:
            video_groups[vid] = []
        video_groups[vid].append(seg)
    
    # Pick the video with the strongest evidence. A pure sum rewards videos
    # that happen to have more near-duplicate segments, so rank by the best
    # hit plus the average of the best few hits instead.
    def video_score(video_segments):
        ranked = sorted(video_segments, key=lambda item: item["similarity"], reverse=True)
        strongest = ranked[0]["similarity"]
        supporting = ranked[: min(3, len(ranked))]
        average_support = sum(item["similarity"] for item in supporting) / len(supporting)
        return (0.7 * strongest) + (0.3 * average_support)

    best_video_id = max(
        video_groups.keys(),
        key=lambda vid: video_score(video_groups[vid])
    )
    best_segments = sorted(
        video_groups[best_video_id],
        key=lambda item: item["similarity"],
        reverse=True,
    )[:top_k]
    
    print(f"Best match: {best_video_id} ({len(best_segments)} segments)")
    
    # Get video info
    video_url = vector_store.get_video_url(best_video_id)
    summary = vector_store.get_video_summary(best_video_id)
    
    if not video_url:
        return {
            "answer": "Found relevant content but video URL not available.",
            "video_url": None,
            "error": "Video URL not found"
        }
    
    # Find clip boundaries for timestamp
    clip_start, clip_end = clip_manager.find_clip_bounds(best_segments)
    
    # Create timestamped YouTube URL
    timestamp_seconds = int(clip_start) if clip_start else 0
    timestamped_url = f"{video_url}&t={timestamp_seconds}" if "?" in video_url else f"{video_url}?t={timestamp_seconds}"
    
    # Generate answer using local Ollama with summary as context
    print("Generating answer...")
    answer = generate_response(
        query=query,
        summary=summary or "No summary available",
        context_chunks=best_segments
    )
    
    return {
        "answer": answer,
        "video_url": timestamped_url,
        "original_video_url": video_url,
        "clip_start": clip_start,
        "clip_end": clip_end,
        "video_id": best_video_id,
        "segments_used": len(best_segments),
        "max_similarity": max(seg["similarity"] for seg in best_segments),
        "segments": best_segments,
    }
