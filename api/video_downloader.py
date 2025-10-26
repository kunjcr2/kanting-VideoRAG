import yt_dlp
import os
from urllib.parse import urlparse, parse_qs

class VideoDownloader:
    def __init__(self, download_dir="videos"):
        self.download_dir = download_dir
        os.makedirs(download_dir, exist_ok=True)
    
    def download_video(self, url, video_name=None):
        """Download YouTube video"""
        if video_name is None:
            # Extract video ID from URL for naming
            parsed = urlparse(url)
            if 'youtube.com' in parsed.netloc or 'youtu.be' in parsed.netloc:
                if 'youtu.be' in parsed.netloc:
                    # Short URL format: https://youtu.be/VIDEO_ID
                    video_name = parsed.path.lstrip('/')
                else:
                    # Standard URL format: https://www.youtube.com/watch?v=VIDEO_ID
                    query_params = parse_qs(parsed.query)
                    video_name = query_params.get('v', ['downloaded_video'])[0]
            else:
                video_name = "downloaded_video"
        
        # Remove any file extension if present in video_name
        video_name = os.path.splitext(video_name)[0]
        
        ydl_opts = {
            'format': 'best[height<=720]',
            'outtmpl': os.path.join(self.download_dir, f'{video_name}.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                print(f"🔄 Downloading from: {url}")
                info = ydl.extract_info(url, download=True)
                video_path = ydl.prepare_filename(info)
                print(f"✅ Downloaded: {video_path}")
                
                # Verify file exists
                if os.path.exists(video_path):
                    return video_path
                else:
                    print(f"❌ File not found after download: {video_path}")
                    return None
                    
        except Exception as e:
            print(f"❌ Download failed: {e}")
            import traceback
            traceback.print_exc()
            return None

# SHORTER EDUCATIONAL VIDEOS (2-8 minutes each)
EDUCATIONAL_VIDEOS = {
    # Computer Science & Programming (2-5 minutes)
    "python_functions": "https://www.youtube.com/watch?v=BRc4TcWUUUE",  # 3:21 - Python functions explained
    "neural_networks_basics": "https://www.youtube.com/watch?v=IHZwWFHWa-w",  # 4:37 - Neural networks in 5 minutes
    "machine_learning_intro": "https://www.youtube.com/watch?v=ukzFI9rgwfU",  # 2:35 - Machine learning basics
    "html_css_basics": "https://www.youtube.com/watch?v=G3e-cpL7ofc",  # 6:30 - HTML & CSS tutorial
    "sql_basics": "https://www.youtube.com/watch?v=27axs9dO7AE",  # 4:26 - SQL in 5 minutes
    
    # Data Science (3-6 minutes)
    "pandas_intro": "https://www.youtube.com/watch?v=vmEHCJofslg",  # 5:22 - Pandas in 5 minutes
    "data_visualization": "https://www.youtube.com/watch?v=a9UrKfmE42g",  # 3:48 - Data visualization basics
    "numpy_tutorial": "https://www.youtube.com/watch?v=QUT1VHiLmmI",  # 4:31 - NumPy in 5 minutes
    
    # Algorithms & Concepts (2-4 minutes)
    "binary_search": "https://www.youtube.com/watch?v=MFhxShGxHWc",  # 3:37 - Binary search algorithm
    "quick_sort": "https://www.youtube.com/watch?v=Hoixgm4-P4M",  # 3:39 - Quick sort explained
    "big_o_notation": "https://www.youtube.com/watch?v=__vX2sjlpXU",  # 3:50 - Big O notation
    
    # Web Development (3-7 minutes)
    "javascript_functions": "https://www.youtube.com/watch?v=N8ap4k_1QEQ",  # 4:38 - JavaScript functions
    "react_components": "https://www.youtube.com/watch?v=FRjlF74_EZk",  # 3:31 - React components
    "api_rest": "https://www.youtube.com/watch?v=lsMQRaeKNDk",  # 4:56 - REST APIs explained
    
    # Cloud & DevOps (3-5 minutes)
    "docker_explained": "https://www.youtube.com/watch?v=pg19Z8LL06w",  # 3:58 - Docker in 4 minutes
    "aws_ec2": "https://www.youtube.com/watch?v=lZMqOMZ8Zjk",  # 4:12 - AWS EC2 basics
    "git_basics": "https://www.youtube.com/watch?v=USjZcfj8yxE",  # 3:57 - Git tutorial
}

# EVEN SHORTER VIDEOS (1-3 minutes) - for quick testing
QUICK_TEST_VIDEOS = {
    "python_variables": "https://www.youtube.com/watch?v=Z1Yd7upQsXY",  # 2:14 - Python variables
    "ml_supervised": "https://www.youtube.com/watch?v=4qVRBYAdLAo",  # 1:46 - Supervised learning
    "css_flexbox": "https://www.youtube.com/watch?v=phWxA89Dy94",  # 2:21 - CSS Flexbox
    "sql_select": "https://www.youtube.com/watch?v=zbMHLJ0dY4w",  # 2:23 - SQL SELECT
    "git_commit": "https://www.youtube.com/watch?v=Uszj_k0DGsg",  # 1:52 - Git commit
}

# ULTRA-FAST TEST SET (under 2 minutes each)
ULTRA_FAST_VIDEOS = {
    "python_print": "https://www.youtube.com/watch?v=UsCQXe1OHZk",  # 1:15 - Python print function
    "html_tags": "https://www.youtube.com/watch?v=KUmkq5wGprI",  # 1:30 - HTML basic tags
    "css_colors": "https://www.youtube.com/watch?v=Hl9g1hHZkio",  # 1:28 - CSS colors
    "js_variables": "https://www.youtube.com/watch?v=edlFjlzxkSI",  # 1:35 - JavaScript variables
}