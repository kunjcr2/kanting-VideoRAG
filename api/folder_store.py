"""Folder-scoped vector stores for isolated video collections."""

import os
import re
from typing import Dict, List

from vector_store import VectorStore


class FolderVectorStore:
    def __init__(self, root_dir: str = None, device: str = None):
        self.root_dir = root_dir or os.getenv("VECTOR_STORE_DIR", "vector_data")
        self.device = device or os.getenv("EMBEDDING_DEVICE", "cpu")
        os.makedirs(self.root_dir, exist_ok=True)
        self._stores: Dict[str, VectorStore] = {}

    @staticmethod
    def normalize_folder(folder: str) -> str:
        value = (folder or "default").strip().lower()
        value = re.sub(r"[^a-z0-9._-]+", "-", value).strip(".-")
        return value or "default"

    def _path_for(self, folder: str) -> str:
        folder = self.normalize_folder(folder)
        # Preserve the original single-store data as the logical default folder.
        if folder == "default" and os.path.exists(os.path.join(self.root_dir, "faiss.index")):
            return self.root_dir
        return os.path.join(self.root_dir, folder)

    def get_store(self, folder: str = "default") -> VectorStore:
        folder = self.normalize_folder(folder)
        if folder not in self._stores:
            self._stores[folder] = VectorStore(storage_dir=self._path_for(folder), device=self.device)
        return self._stores[folder]

    def list_folders(self) -> List[str]:
        folders = set()
        if os.path.exists(os.path.join(self.root_dir, "faiss.index")):
            folders.add("default")
        for name in os.listdir(self.root_dir):
            path = os.path.join(self.root_dir, name)
            if os.path.isdir(path) and os.path.exists(os.path.join(path, "faiss.index")):
                folders.add(name)
        return sorted(folders)

    def get_stats(self) -> Dict:
        videos = self.get_videos()
        return {
            "total_videos": len(videos),
            "total_segments": sum(len(video["segments"]) for video in videos),
            "videos": [video["id"] for video in videos],
            "folders": self.list_folders(),
        }

    def get_videos(self) -> List[Dict]:
        videos = []
        for folder in self.list_folders():
            for video in self.get_store(folder).get_videos():
                video["folder"] = folder
                videos.append(video)
        return videos
