"""
FAISS Vector Store for Kanting

Stores video transcript segments with embeddings for semantic search.
Uses FAISS for efficient similarity search.
"""

import json
import os
import uuid
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


class VectorStore:
    def __init__(self, storage_dir: str = "vector_data", device: str = "cuda"):
        """
        Initialize FAISS vector store.
        
        Args:
            storage_dir: Directory to store index and metadata
            device: 'cuda' or 'cpu' for embedding model
        """
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Paths
        self.index_path = os.path.join(storage_dir, "faiss.index")
        self.metadata_path = os.path.join(storage_dir, "metadata.json")
        
        # Initialize embedding model
        self.model = SentenceTransformer('all-MiniLM-L6-v2', device=device)
        self.embedding_dim = 384  # Dimension of all-MiniLM-L6-v2
        
        # Load or create FAISS index
        self.index = self._load_or_create_index()
        
        # Load or create metadata
        self.metadata = self._load_metadata()
    
    def _load_or_create_index(self) -> faiss.IndexFlatIP:
        """Load existing FAISS index or create new one."""
        if os.path.exists(self.index_path):
            print(f"Loading existing FAISS index from {self.index_path}")
            return faiss.read_index(self.index_path)
        else:
            print("Creating new FAISS index")
            # Using Inner Product (cosine similarity with normalized vectors)
            return faiss.IndexFlatIP(self.embedding_dim)
    
    def _load_metadata(self) -> Dict:
        """Load metadata from JSON or create new structure."""
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {
                "videos": {},      # video_id -> {url, path, summary, title}
                "segments": []     # List of segment metadata (aligned with FAISS index)
            }
    
    def _save(self):
        """Save FAISS index and metadata to disk."""
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        print(f"Saved index and metadata to {self.storage_dir}")
    
    def add_video(
        self, 
        video_url: str, 
        transcript: str, 
        video_path: str = None,
        summary: str = None,
        title: str = None
    ) -> str:
        """
        Add video transcript to the vector store.
        
        Args:
            video_url: Original YouTube URL
            transcript: Transcript in format "text,start,end\ntext,start,end..."
            video_path: Local path to video file (optional)
            summary: AI-generated summary (optional)
            title: Video title (optional)
            
        Returns:
            video_id: Unique identifier for the video
        """
        video_id = f"video_{uuid.uuid4().hex[:8]}"
        
        # Store video metadata
        self.metadata["videos"][video_id] = {
            "url": video_url,
            "path": video_path,
            "summary": summary,
            "title": title
        }
        
        # Parse transcript into segments
        segments = self._parse_transcript(transcript, video_id)
        
        if not segments:
            print(f"No valid segments found in transcript")
            return video_id
        
        # Generate embeddings for all segments
        texts = [seg["text"] for seg in segments]
        embeddings = self.model.encode(texts, normalize_embeddings=True)
        
        # Add embeddings to FAISS index
        embeddings_np = np.array(embeddings).astype('float32')
        self.index.add(embeddings_np)
        
        # Store segment metadata (aligned with FAISS index)
        for seg in segments:
            self.metadata["segments"].append(seg)
        
        # Save to disk
        self._save()
        
        print(f"Added {len(segments)} segments from video {video_id}")
        return video_id
    
    def _parse_transcript(self, transcript: str, video_id: str) -> List[Dict]:
        """Parse transcript string into segment dictionaries."""
        segments = []
        
        for line in transcript.strip().split('\n'):
            # Split from right to handle text that might contain commas
            parts = line.rsplit(',', 2)
            if len(parts) == 3:
                try:
                    text = parts[0].strip()
                    start = float(parts[1].strip())
                    end = float(parts[2].strip())
                    
                    if text:  # Only add non-empty segments
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
        Search for most relevant segments.
        
        Args:
            query: Search query string
            top_k: Number of results to return
            
        Returns:
            List of segment dictionaries with similarity scores
        """
        if self.index.ntotal == 0:
            return []
        
        # Encode query
        query_embedding = self.model.encode([query], normalize_embeddings=True)
        query_np = np.array(query_embedding).astype('float32')
        
        # Search FAISS
        k = min(top_k, self.index.ntotal)
        similarities, indices = self.index.search(query_np, k)
        
        # Build results with metadata
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.metadata["segments"]):
                segment = self.metadata["segments"][idx].copy()
                segment["similarity"] = float(similarities[0][i])
                results.append(segment)
        
        # Debug: Show what segments are being returned
        if results:
            print(f"DEBUG [vector_store.search]: Returning {len(results)} segments")
            for i, seg in enumerate(results[:3]):
                print(f"  Result {i}: start={seg.get('start')}, end={seg.get('end')}, keys={list(seg.keys())}")
        
        return results
    
    def get_video_url(self, video_id: str) -> Optional[str]:
        """Get original video URL for a video."""
        video_info = self.metadata["videos"].get(video_id)
        return video_info.get("url") if video_info else None
    
    def get_video_summary(self, video_id: str) -> Optional[str]:
        """Get summary for a video."""
        video_info = self.metadata["videos"].get(video_id)
        return video_info.get("summary") if video_info else None
    
    def update_video_summary(self, video_id: str, summary: str):
        """Update the summary for a video."""
        if video_id in self.metadata["videos"]:
            self.metadata["videos"][video_id]["summary"] = summary
            self._save()
    
    def get_video_path(self, video_id: str) -> Optional[str]:
        """Get local video path for a video."""
        video_info = self.metadata["videos"].get(video_id)
        return video_info.get("path") if video_info else None
    
    def get_stats(self) -> Dict:
        """Get storage statistics."""
        return {
            "total_videos": len(self.metadata["videos"]),
            "total_segments": self.index.ntotal,
            "videos": list(self.metadata["videos"].keys())
        }
    
    def clear(self):
        """Clear all data from the store."""
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        self.metadata = {"videos": {}, "segments": []}
        self._save()
        print("Vector store cleared")


# Quick test
if __name__ == "__main__":
    print("Testing FAISS Vector Store...")
    
    # Use CPU for testing
    store = VectorStore(storage_dir="test_vector_data", device="cpu")
    
    # Test transcript
    test_transcript = """Hello everyone welcome,0.0,2.5
Today we learn Python,2.5,5.0
Python is powerful,5.0,8.0"""
    
    # Add video
    video_id = store.add_video(
        video_url="https://youtube.com/watch?v=test123",
        transcript=test_transcript,
        summary="A Python tutorial video"
    )
    
    print(f"\nAdded video: {video_id}")
    print(f"Stats: {store.get_stats()}")
    
    # Search
    results = store.search("What is Python?", top_k=3)
    print(f"\nSearch results for 'What is Python?':")
    for r in results:
        print(f"  [{r['start']:.1f}s] {r['text']} (sim: {r['similarity']:.3f})")