# Cv_extractor

A web application that extracts structured information from CVs. It serves a small [FastAPI](https://fastapi.tiangolo.com) backend with a browser interface, reads the text of the uploaded file and sends it to the `gemma3:4b` model through [Ollama](https://ollama.com), which returns the CV data as JSON.

## Requirements

- Python 3.9+
- Ollama running locally (default: `http://localhost:11434`)
- The `gemma3:4b` model: `ollama pull gemma3:4b`
- Python packages: `pip install fastapi uvicorn jinja2 pymupdf requests`

## Usage

```
python main.py
```

1. Open `http://127.0.0.1:8000` in your browser.
2. Drag a CV into the upload area or click to select it (`.pdf` or `.txt`, max. 10 MB).
3. Click **Extract information** and wait for the result.
4. Review the extracted data by section, view the raw JSON or copy it.

> PDFs must contain selectable text. Scanned PDFs (images) are not supported.

## Validations

- Only `.pdf` and `.txt` files up to 10 MB are accepted.
- If the extracted text is shorter than `MIN_TEXT_LENGTH` (100 characters), the PDF is treated as scanned and an error is shown.
- The text is checked against a list of English and Spanish CV keywords. If fewer than `MIN_CV_KEYWORDS` (5) are found, the user is asked to confirm that the file is really a CV before it is processed.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web interface |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/extract?extension=.pdf&confirm=false` | Extracts the CV data. The file bytes are sent as the request body. Returns `409` when the file does not look like a CV and `confirm` is not `true` |

## Project structure

```
.
├── main.py              # FastAPI app and endpoints
├── llm.py               # Ollama request
├── pdfExtractor.py      # PDF text extraction and validation rules
├── agentExtractor.md    # System instruction and expected JSON structure
├── templates/
│   └── index.html
└── static/
    ├── app.js
    └── style.css
```
