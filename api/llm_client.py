"""Local Ollama client for summaries and video question answering."""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "180"))


def _fallback_summary(transcript: str) -> str:
    text = " ".join(line.rsplit(',', 2)[0].strip() for line in transcript.splitlines())
    text = " ".join(text.split())
    if not text:
        return "No transcript content was available."
    return text[:300].rstrip() + ("..." if len(text) > 300 else "")


def _chat(system: str, prompt: str) -> str:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            "options": {"temperature": 0.2},
        },
        timeout=OLLAMA_TIMEOUT,
    )
    response.raise_for_status()
    message = response.json().get("message", {}).get("content", "").strip()
    if not message:
        raise RuntimeError("Ollama returned an empty response")
    return message


def generate_summary(transcript: str) -> str:
    """
    Generate a brief summary of a video transcript.
    
    Args:
        transcript: Raw transcript with timestamps (format: "text,start,end\n...")
        
    Returns:
        Brief summary string (2-3 sentences)
    """
    # Extract just the text from the transcript
    text_only = []
    for line in transcript.strip().split('\n'):
        parts = line.rsplit(',', 2)
        if len(parts) >= 1:
            text_only.append(parts[0].strip())
    
    full_text = ' '.join(text_only)
    
    # Truncate if too long (keep ~8000 chars for context window)
    if len(full_text) > 8000:
        full_text = full_text[:8000] + "..."
    
    prompt = f"""Summarize this video transcript in 2-3 sentences. Focus on the main topic and key points.

Transcript:
{full_text}

Summary:"""

    try:
        return _chat("You create concise video summaries.", prompt)
    except requests.RequestException as exc:
        print(f"Ollama unavailable ({exc}); using an extractive summary.")
        return _fallback_summary(transcript)


def generate_response(query: str, summary: str, context_chunks: list, video_title: str = None) -> str:
    """
    Generate an answer to a user question based on video summary and relevant chunks.
    
    Args:
        query: User's question
        summary: Brief summary of the video (generated earlier)
        context_chunks: List of relevant transcript segments with timestamps
        video_title: Optional video title for context
        
    Returns:
        AI-generated answer
    """
    # Format context chunks
    chunks_text = "\n\n".join([
        f"[{chunk['start']:.1f}s - {chunk['end']:.1f}s]: {chunk['text']}"
        for chunk in context_chunks[:5]  # Use top 5 chunks
    ])
    
    title_context = f"Video: {video_title}\n" if video_title else ""
    
    prompt = f"""You are a helpful assistant answering questions about video content.

{title_context}Video Summary: {summary}

Relevant Transcript Sections:
{chunks_text}

User Question: {query}

Instructions:
- Answer based on the video content provided above
- Be clear and concise
- If the information isn't in the provided content, say so politely

Answer:"""

    try:
        return _chat("You answer questions using only the supplied video transcript.", prompt)
    except requests.RequestException as exc:
        print(f"Ollama unavailable ({exc}); using the best retrieved transcript segment.")
        return f"Based on the available transcript: {context_chunks[0]['text']}"


# Test
if __name__ == "__main__":
    # Quick test with dummy data
    test_transcript = """Hello everyone welcome to this video,0.0,2.5
Today we're going to learn about Python,2.5,5.0
Python is a great programming language,5.0,8.0
It's easy to learn and very powerful,8.0,11.0"""
    
    print("Testing summary generation...")
    summary = generate_summary(test_transcript)
    print(f"Summary: {summary}")
    
    print("\nTesting response generation...")
    chunks = [
        {"text": "Python is a great programming language", "start": 5.0, "end": 8.0},
        {"text": "It's easy to learn and very powerful", "start": 8.0, "end": 11.0}
    ]
    response = generate_response("What is Python?", summary, chunks)
    print(f"Response: {response}")
