# AI/ML Engineering Portfolio

Welcome to my **ai-ml-engineering-portfolio**, a collection of projects that showcase my knowledge and skills in Artificial Intelligence and Machine Learning Engineering.

## Purpose

This repository is a portfolio. Over time, I plan to upload a variety of projects at different difficulty levels, from introductory exercises to more advanced, production-oriented systems, in order to demonstrate a broad range of knowledge across these areas.

## Structure

Each project lives in its own folder and is self-contained, with its own dependencies and documentation:

```
.
├── project-name/
│   ├── env/            # Local virtual environment (ignored by git)
│   ├── README.md       # Project description, setup and usage
│   └── ...
└── README.md
```

## Getting Started

Each project manages its own virtual environment. To run a project:

```bash
cd project-name
python -m venv env
# Windows
env\Scripts\activate
# macOS / Linux
source env/bin/activate
pip install -r requirements.txt
```

> Folders named `env` are excluded from version control via `.gitignore`.

## Projects

| Project | Difficulty | Description |
|---------|------------|-------------|
| [Llm_api](Llm_api) | Beginner | A terminal conversational agent that chats with the `gemma3:4b` model through Ollama, using only the `requests` library. |
| [Cv_extractor](Cv_extractor) | Intermediate | A FastAPI web app that extracts structured JSON data from PDF or TXT CVs using a local LLM, with file validation and a browser interface. |

## License

This repository is for educational and portfolio purposes.
