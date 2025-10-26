import os

class TranscriptGenerator:
    """
    Transcript generator supporting cloud (OpenAI) and local (whisper) services.
    """

    def __init__(self, service: str = "openai", model_size: str = "base"):
        pass

    def transcribe_video(self, video_path):
        """Transcribe a video file and save a lightweight timestamped transcript.

        Returns (transcript_text, transcript_path) or (None, None) on failure.
        """
        transcript_path = video_path.replace(".mp4", "_transcript.txt")
        
        try:
            with open(transcript_path, "r", encoding="utf-8") as f:
                transcript_text = f.read()
                transcript_path = self._edit_transcript(transcript_text)
            
            return transcript_text, transcript_path
        except Exception as e:
            print(f"Failed to read transcript: {e}")
            return None, None
    
    def _edit_transcript(self, transcript):
        """
        Combine specific consecutive lines that form complete sentences.
        """
        lines = transcript.strip().split('\n')
        
        # Parse all lines
        parsed_lines = []
        for line in lines:
            if line.strip():  # Skip empty lines
                parts = line.split(",")
                if len(parts) >= 3:
                    # Join the sentence part in case there are commas in the text
                    sen = parts[0]
                    for part in parts[1:-2]:
                        sen += "," + part
                    s = parts[-2]
                    e = parts[-1]
                    parsed_lines.append({
                        'sentence': sen.strip(),
                        'start': s.strip(),
                        'end': e.strip()
                    })
        
        # Smart combination: look for lines that form complete thoughts
        combined_lines = []
        i = 0
        while i < len(parsed_lines):
            current_line = parsed_lines[i]
            
            # Check if we should combine with next line
            if (i + 1 < len(parsed_lines) and 
                self._should_combine(current_line['sentence'], parsed_lines[i + 1]['sentence'])):
                
                # Combine current line with next line
                combined_sentence = current_line['sentence'] + " " + parsed_lines[i + 1]['sentence']
                combined_start = current_line['start']
                combined_end = parsed_lines[i + 1]['end']
                
                combined_lines.append({
                    'sentence': combined_sentence,
                    'start': combined_start,
                    'end': combined_end
                })
                i += 2  # Skip the next line since we combined it
            else:
                # Keep the line as is
                combined_lines.append(current_line)
                i += 1
        
        # Rebuild the transcript
        transcript_lines = []
        for line in combined_lines:
            transcript_lines.append(f"{line['sentence']},{line['start']},{line['end']}")
        
        return '\n'.join(transcript_lines)

    def _should_combine(self, sentence1, sentence2):
        """
        Determine if two sentences should be combined.
        Customize this logic based on your needs.
        """
        # Example logic - combine if the first sentence doesn't end with proper punctuation
        # or if they seem to form a continuous thought
        if sentence1.endswith(('.', '!', '?')):
            return False
        return True