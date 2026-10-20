import requests
from pathlib import Path

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "gemma3:4b"


def extract_cv_info(cv_text: str) -> dict:

    agentInstruction = (Path(__file__).parent / "agentExtractor.md").read_text(encoding="utf-8")
    
    messages = [
            {
                "role": "system",
                "content": agentInstruction
            }
    ]
    
    response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "messages": messages + [{"role": "user", "content": cv_text}],
                "stream": False
            }
        )

    return response.json()