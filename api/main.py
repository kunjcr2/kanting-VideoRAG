import os
import random
from typing import Dict, List
from vector_store import VectorStore
from clip_manager import ClipManager

import whisper
import torch

def store_transcript(transcript: str, video_path: str, video_url: str, vector_store: VectorStore):
    """
    Store transcript in vector store
    
    Args:
        transcript: Raw transcript with timestamps
        video_path: Path to video file (local path after download)
        vector_store: VectorStore instance
        
    Returns:
        Dict with video_id and stats
    """    
    video_id = vector_store.add_video(video_path, transcript)
    stats = vector_store.get_stats()

    import anthropic

    client = anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )
    
    prompt = f"""Please analyze this video transcript and create structured notes with the following sections:

                1. **Main Topic/Title**: A clear title for the video
                2. **Summary**: 2-3 sentence overview
                3. **Key Points**: Bullet points of main ideas (5-7 points)
                4. **Important Timestamps/Quotes**: Notable moments (if timestamps are present)
                5. **Takeaways**: Action items or conclusions

                Transcript:
                {transcript}
        """
    
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    # Extract the response
    notes = message.content[0].text
    
    video_id = vector_store.add_video(video_path, transcript, video_url)
    return {"video_id": video_id, "status": "success", "notes": notes}

def query_and_extract_clip(
    query: str,
    vector_store: VectorStore,
    clip_manager: ClipManager,
    output_dir: str = "clips",
    top_k: int = 10
) -> Dict:
    """
    Query vector store and return video URL with timestamps
    
    Args:
        query: User query
        vector_store: VectorStore instance  
        clip_manager: ClipManager instance
        output_dir: Output directory for clips (unused, kept for compatibility)
        top_k: Number of top segments to consider
        
    Returns:
        Dict with answer, video URL with timestamps, and segments
    """
    # Step 1: Search for relevant segments
    print(f"Searching for: '{query}'")
    segments = vector_store.search(query, top_k=top_k)
    
    if not segments:
        return {
            "answer": "No relevant content found.",
            "video_url": None,
            "error": "No segments found"
        }
    
    # Step 2: Group segments by video and pick best video
    video_groups = {}
    for seg in segments:
        video_id = seg["video_id"]
        if video_id not in video_groups:
            video_groups[video_id] = []
        video_groups[video_id].append(seg)
    
    # Pick video with most segments (you could also use average similarity)
    best_video_id = max(video_groups.keys(), key=lambda vid: len(video_groups[vid]))
    best_segments = video_groups[best_video_id]
    
    print(f"Selected video: {best_video_id} with {len(best_segments)} segments")
    
    # Step 3: Find clip boundaries
    clip_start, clip_end = clip_manager.find_clip_bounds(best_segments)
    
    # Step 4: Get original video URL from vector store
    video_url = vector_store.get_video_url(best_video_id)
    
    if not video_url:
        return {
            "answer": "Found relevant content but video URL not available.",
            "segments": best_segments,
            "video_url": None,
            "error": "Video URL not found"
        }
    
    # Step 5: Create timestamped URL
    # Format: original_url?t=start (or #t=start,end for some platforms)
    # You can customize this based on your video platform
    timestamped_url = f"{video_url}?t={int(clip_start)}"
    # Alternative format with start and end: f"{video_url}#t={int(clip_start)},{int(clip_end)}"
    
    # Step 6: Generate answer from segments
    answer_text = generate_answer_from_segments(query, best_segments)
    
    return {
        "answer": answer_text,
        "video_url": timestamped_url,
        "original_video_url": video_url,
        "clip_start": clip_start,
        "clip_end": clip_end,
        "video_id": best_video_id,
        "segments_used": len(best_segments),
        "max_similarity": max(seg["similarity"] for seg in best_segments)
    }
def generate_answer_from_segments(query: str, segments: List[Dict]) -> str:
    """
    Generate answer text from relevant segments
    
    Args:
        query: Original query
        segments: Relevant segments with text
        
    Returns:
        Answer text
    """
    # Simple concatenation - you could use LLM here for better answers
    relevant_texts = [seg["text"] for seg in segments[:3]]  # Use top 3 segments
    combined_text = " ".join(relevant_texts)
    
    return f"Based on the content: {combined_text[:500]}..." if len(combined_text) > 500 else combined_text

def get_transcript(video_path):
    """
    Extract transcript from video using Whisper medium model on CUDA.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Transcript string in format: "line,start,end\nline,start,end\n..."
        Returns None if extraction fails
    """
    try:
        # Check if CUDA is available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load Whisper medium model
        model = whisper.load_model("medium", device=device)
        
        # Transcribe the video
        result = model.transcribe(
            video_path,
            verbose=False,
            word_timestamps=False  # We want segment-level timestamps
        )
        
        # Format transcript as requested: line,start,end
        transcript_lines = []
        for segment in result['segments']:
            text = segment['text'].strip()
            start = segment['start']
            end = segment['end']
            transcript_lines.append(f"{text},{start},{end}")
        
        # Join all lines with newline
        transcript = "\n".join(transcript_lines)
        
        return transcript if transcript else None
        
    except Exception as e:
        print(f"Error extracting transcript: {str(e)}")
        return None