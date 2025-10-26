import os
import random
from typing import Dict, List
from vector_store import VectorStore
from clip_manager import ClipManager

def store_transcript(transcript: str, video_path: str, vector_store: VectorStore) -> Dict:
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

                Please format your response as JSON with these keys: title, summary, key_points (array), timestamps (array), takeaways (array)
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
    
    return {
        "video_id": video_id,
        "notes": notes
    }

def query_and_extract_clip(
    query: str,
    vector_store: VectorStore,
    clip_manager: ClipManager,
    output_dir: str = "clips",
    top_k: int = 10
) -> Dict:
    """
    Query vector store and extract relevant video clip
    
    Args:
        query: User query
        vector_store: VectorStore instance  
        clip_manager: ClipManager instance
        output_dir: Output directory for clips
        top_k: Number of top segments to consider
        
    Returns:
        Dict with answer, clip info, and segments
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Step 1: Search for relevant segments
    print(f"Searching for: '{query}'")
    segments = vector_store.search(query, top_k=top_k)
    
    if not segments:
        return {
            "answer": "No relevant content found.",
            "clip_path": None,
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
    
    # Step 4: Get video path and extract clip
    video_path = vector_store.get_video_path(best_video_id)
    clip_filename = f"clip_{clip_start:.1f}_{clip_end:.1f}_{random.randint(1000,9999)}.mp4"
    clip_path = os.path.join(output_dir, clip_filename)
    
    success = clip_manager.extract_clip(video_path, clip_start, clip_end, clip_path)
    
    if not success:
        return {
            "answer": "Found relevant content but failed to extract clip.",
            "segments": best_segments,
            "clip_path": None,
            "error": "Clip extraction failed"
        }
    
    # Step 5: Generate answer from segments
    answer_text = generate_answer_from_segments(query, best_segments)
    
    return {
        "answer": answer_text,
        "clip_path": clip_path,
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