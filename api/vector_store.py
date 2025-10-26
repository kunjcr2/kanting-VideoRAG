import json
# Ensure GPU availability early
import gpu_init  # will raise helpful error if CUDA/PyTorch isn't configured
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import os
from typing import List, Dict, Any
import uuid

class VectorStore:
    def __init__(self, storage_path: str = "vector_store.json"):
        self.storage_path = storage_path
        self.model = SentenceTransformer('all-MiniLM-L6-v2', device="cuda")
        self.data = self._load_data()
    
    def _load_data(self) -> Dict:
        """Load existing data or create new structure"""
        if os.path.exists(self.storage_path):
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        else:
            return {
                "segments": [],
                "videos": {}
            }
    
    def _save_data(self):
        """Save data to JSON file"""
        with open(self.storage_path, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get_video_url(self, video_id: str) -> str:
        """
        Get original video URL for a given video_id
        
        Args:
            video_id: Video identifier
            
        Returns:
            Original video URL or None if not found
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT video_url FROM videos WHERE id = ?", (video_id,))
        result = cursor.fetchone()
        return result[0] if result else None    
    
    def add_video(self, video_path: str, transcript: str, video_url: str = None) -> str:
        """
        Add video transcript to storage
        
        Args:
            video_path: Path to video file
            transcript: Format "text, start, end\\ntext, start, end..."
            video_url: Original video URL (optional)
            
        Returns:
            video_id: Unique identifier for the video
        """
        video_id = f"video_{uuid.uuid4().hex[:8]}"
        
        # Store video path and URL
        self.data["videos"][video_id] = {
            "path": video_path,
            "url": video_url
        }
        
        # Parse and store segments
        segments = self._parse_transcript(transcript, video_id)
        
        # Generate embeddings for each segment
        texts = [seg["text"] for seg in segments]
        embeddings = self.model.encode(texts)
        
        for i, seg in enumerate(segments):
            seg["embedding"] = embeddings[i].tolist()
            seg["segment_id"] = f"seg_{uuid.uuid4().hex[:8]}"
            self.data["segments"].append(seg)

        self._save_data()
        return video_id
    
    def _parse_transcript(self, transcript: str, video_id: str) -> List[Dict]:
        """Parse transcript into segments with timestamps"""
        segments = []
        
        for line in transcript.strip().split('\n'):
            parts = line.rsplit(',', 2)
            if len(parts) == 3:
                try:
                    text = parts[0].strip()
                    start = float(parts[1].strip())
                    end = float(parts[2].strip())
                    
                    segments.append({
                        "text": text,
                        "start": start,
                        "end": end,
                        "video_id": video_id
                    })
                except ValueError:
                    continue
        
        return segments
    
    def search(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        Search for most relevant segments using cosine similarity
        
        Args:
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of segment dictionaries with similarity scores
        """
        if not self.data["segments"]:
            return []
        
        # Generate query embedding
        query_embedding = self.model.encode([query])
        
        # Get all segment embeddings
        segment_embeddings = np.array([seg["embedding"] for seg in self.data["segments"]])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_embedding, segment_embeddings)[0]
        
        # Combine segments with similarity scores
        scored_segments = []
        for i, seg in enumerate(self.data["segments"]):
            scored_segments.append({
                **seg,
                "similarity": float(similarities[i])
            })
        
        # Sort by similarity and return top_k
        scored_segments.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_segments[:top_k]
    
    def get_video_path(self, video_id: str) -> str:
        """Get video path by video_id"""
        video_info = self.data["videos"].get(video_id)
        if video_info and isinstance(video_info, dict):
            return video_info.get("path")
        # Backward compatibility: if it's just a string (old format)
        elif isinstance(video_info, str):
            return video_info
        return None 
    
    def get_stats(self) -> Dict:
        """Get storage statistics"""
        return {
            "total_segments": len(self.data["segments"]),
            "total_videos": len(self.data["videos"]),
            "videos": list(self.data["videos"].keys())
        }