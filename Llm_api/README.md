# Llm_api

A basic conversational agent project. It uses the `gemma3:4b` model through [Ollama](https://ollama.com) and has no dependencies beyond the `requests` library.

## Requirements

- Python 3.9+
- Ollama running locally (default: `http://localhost:11434`)
- The `gemma3:4b` model: `ollama pull gemma3:4b`
- `requests`: `pip install requests`

## Usage

```
python main.py
```

1. Enter the agent instruction, or leave it empty to use no custom instructions.
2. Chat with the agent in the terminal.
3. Type `exit` to quit.
