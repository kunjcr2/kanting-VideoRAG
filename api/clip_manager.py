import subprocess
import os
from typing import Dict, List, Tuple, Optional

class ClipManager:
    def __init__(self, ffmpeg_path: str = None):
        self.ffmpeg_path = ffmpeg_path or self._find_ffmpeg()
    
    def _find_ffmpeg(self) -> str:
        """Find FFmpeg executable"""
        # Try common paths
        paths = [
            "ffmpeg",
            "C:/Users/kunjs/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.0-full_build/bin/ffmpeg.exe"
        ]
        
        for path in paths:
            try:
                subprocess.run([path, "-version"], capture_output=True, check=True)
                return path
            except:
                continue
        
        raise Exception("FFmpeg not found. Please install FFmpeg and ensure it's in PATH")
    
    def extract_clip(
        self,
        video_path: str,
        start_time: float,
        end_time: float,
        output_path: str,
        padding: float = 2.0
    ) -> bool:
        """
        Extract video clip with padding
        
        Args:
            video_path: Source video path
            start_time: Start time in seconds
            end_time: End time in seconds  
            output_path: Output file path
            padding: Extra seconds before and after
            
        Returns:
            Success status
        """
        # Apply padding
        start_time = max(0, start_time - padding)
        end_time = end_time + padding
        
        duration = end_time - start_time
        
        try:
            subprocess.run([
                self.ffmpeg_path, "-y",
                "-ss", str(start_time),
                "-t", str(duration),
                "-i", video_path,
                "-c", "copy",
                output_path
            ], check=True, capture_output=True)
            
            return os.path.exists(output_path)
            
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg error: {e.stderr.decode()}")
            return False
    
    def find_clip_bounds(self, segments: List[Dict]) -> Tuple[float, float]:
        """
        Find optimal clip start and end from segments, ensuring:
        - Minimum 10 seconds duration
        - Maximum 60 seconds duration
        - Includes all relevant segments when possible
        - Pads with context if needed to reach minimum duration
        
        Args:
            segments: List of segment dictionaries with start/end times
            
        Returns:
            Tuple of (start_time, end_time) or (None, None) if invalid
        """
        if not segments:
            print("DEBUG: No segments provided to find_clip_bounds")
            return 0, 0
        
        # Debug: Print segment data to identify timestamp issues
        print(f"DEBUG: Processing {len(segments)} segments")
        for i, seg in enumerate(segments[:3]):  # Show first 3 segments
            print(f"  Segment {i}: start={seg.get('start')}, end={seg.get('end')}, text={seg.get('text', '')[:50]}...")
        
        # Get initial bounds from segments
        start_times = [seg.get("start", 0) for seg in segments]
        end_times = [seg.get("end", 0) for seg in segments]
        
        print(f"DEBUG: start_times={start_times[:5]}, end_times={end_times[:5]}")
        
        clip_start = min(start_times)
        clip_end = max(end_times)
        duration = clip_end - clip_start
        
        # If under 10 seconds, extend evenly on both sides
        if duration < 10:
            padding_needed = (10 - duration) / 2
            clip_start = max(0, clip_start - padding_needed)
            clip_end = clip_end + padding_needed
            duration = clip_end - clip_start
        
        # If over 60 seconds, take the most relevant 60-second window
        if duration > 60:
            # Find densest 60-second window of segments
            best_start = clip_start
            max_segments = 0
            
            for start in start_times:
                end = min(start + 60, clip_end)
                segments_in_window = sum(1 for s, e in zip(start_times, end_times) 
                                      if s >= start and e <= end)
                if segments_in_window > max_segments:
                    max_segments = segments_in_window
                    best_start = start
            
            clip_start = best_start
            clip_end = min(clip_start + 60, clip_end)
        
        # Validate final bounds
        if clip_end - clip_start < 10:
            return None, None
            
        return clip_start, clip_end