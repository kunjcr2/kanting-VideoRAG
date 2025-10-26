import os
import json
from vector_store import VectorStore
from clip_manager import ClipManager

class RAGPipeline:
    def __init__(self):
        self.vector_store = VectorStore()
        self.clip_manager = ClipManager()
        self.video_registry = {}  # Track video metadata
    
    def add_video_to_system(self, video_path, transcript, title="Unknown"):
        """Add video to RAG system with metadata"""
        print(f"\n🎬 Adding video to RAG system: {title}")
        
        # Store in vector database
        result = self.store_transcript(transcript, video_path)
        
        # Register video metadata
        video_id = result["video_id"]
        self.video_registry[video_id] = {
            "title": title,
            "path": video_path,
            "transcript": transcript[:500] + "..." if len(transcript) > 500 else transcript
        }
        
        print(f"✅ Video registered: {video_id}")
        return video_id
    
    def store_transcript(self, transcript, video_path):
        """Store transcript in vector store"""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")
        
        video_id = self.vector_store.add_video(video_path, transcript)
        return {"video_id": video_id}
    
    def query_system(self, query, output_dir="clips"):
        """Query the system and get answer with video clip"""
        print(f"\n🔍 Querying: '{query}'")
        
        # Search for relevant content
        segments = self.vector_store.search(query, top_k=10)
        
        if not segments:
            return {
                "answer": "No relevant content found for your query.",
                "clip_path": None,
                "error": "No segments found"
            }
        
        # Group by video and pick best
        video_groups = {}
        for seg in segments:
            video_id = seg["video_id"]
            if video_id not in video_groups:
                video_groups[video_id] = []
            video_groups[video_id].append(seg)
        
        # Pick video with highest total similarity
        best_video_id = max(video_groups.keys(), 
                          key=lambda vid: sum(s["similarity"] for s in video_groups[vid]))
        best_segments = video_groups[best_video_id]
        
        # Get video info
        video_info = self.video_registry.get(best_video_id, {})
        video_title = video_info.get("title", "Unknown Video")
        video_path = self.vector_store.get_video_path(best_video_id)
        
        print(f"🎯 Selected: {video_title} ({len(best_segments)} segments)")
        
        # Find clip boundaries
        clip_start, clip_end = self.clip_manager.find_clip_bounds(best_segments)
        
        # Extract clip
        import random
        os.makedirs(output_dir, exist_ok=True)
        clip_filename = f"answer_{random.randint(1000,9999)}.mp4"
        clip_path = os.path.join(output_dir, clip_filename)

        clip_start = (clip_start-2) if (clip_start-2)>0 else 0
        clip_end = (clip_end+5) if (clip_end+5)<30 else 30
        
        success = self.clip_manager.extract_clip(video_path, clip_start, clip_end, clip_path)

        # Generate answer
        answer = self._generate_answer(query, best_segments, video_title)
        
        return {
            "answer": answer,
            "clip_path": clip_path if success else None,
            "clip_start": clip_start,
            "clip_end": clip_end,
            "video_title": video_title,
            "video_id": best_video_id,
            "segments_used": len(best_segments),
            "max_similarity": max(seg["similarity"] for seg in best_segments),
            "total_duration": clip_end - clip_start
        }
    
    def _generate_answer(self, query, segments, video_title):
        """Generate natural language answer from segments using Claude"""
        
        # Format segments for the prompt
        segments_text = "\n\n".join([
            f"Segment {i+1} (timestamp: {seg['start']:.1f}s - {seg['end']:.1f}s, similarity: {seg['similarity']:.3f}):\n{seg['text']}"
            for i, seg in enumerate(segments)
        ])
        
        # Create the prompt
        prompt = f"""You are a helpful assistant answering questions about video content.

    You have been provided with relevant segments from a video to help answer the user's question.

    User's Question: {query}

    Video Title: {video_title}

    Relevant Video Segments:
    {segments_text}

    Instructions:
    - Answer the user's question based PRIMARILY on the information provided in the video segments above
    - Be clear, concise, and direct in your response
    - If the segments contain sufficient information to answer the question, provide a complete answer without mentioning that you're using video segments
    - ONLY if the segments do not contain relevant information to answer the question, then you may use your general knowledge to provide a helpful response
    - If using general knowledge because segments lack info, briefly mention: "The video segments don't contain specific information about this, but I can help with..."
    - Maintain a natural, conversational tone

    Answer:"""
        
        # Call Claude API
        try:
            import anthropic
            client = anthropic.Anthropic(api_key="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")
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.content[0].text
            
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            # Fallback to simple concatenation if API fails
            combined_text = " ".join([seg["text"] for seg in segments[:3]])
            return f"Based on '{video_title}': {combined_text}"
    
    def get_system_stats(self):
        """Get system statistics"""
        stats = self.vector_store.get_stats()
        stats["registered_videos"] = len(self.video_registry)
        stats["video_titles"] = [info["title"] for info in self.video_registry.values()]
        return stats