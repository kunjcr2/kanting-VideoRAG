"""
OpenAI LLM Client for Kanting

Provides two main functions:
1. generate_summary - Create a brief summary of a transcript
2. generate_response - Answer questions using summary + context chunks
"""

import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"


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

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful assistant that creates concise video summaries."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,
        temperature=0.7
    )
    
    return response.choices[0].message.content.strip()


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

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful video content assistant. Answer questions based on the provided video transcript."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.7
    )
    
    return response.choices[0].message.content.strip()


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
