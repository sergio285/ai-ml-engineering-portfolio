from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from pathlib import Path

app = FastAPI(
    title= "Chat with AI",
    description= "This is a simple API to chat with AI."
)

BASE_DIR = Path(__file__).parent

app.mount("/static"
          , StaticFiles(directory=BASE_DIR / "static")
          , name = "static")

templates = Jinja2Templates(directory=BASE_DIR / "templates")

@app.get("/", response_class = HTMLResponse)
def index(Request : Request):
    return templates.TemplateResponse(request = Request, name = "index.html", context = {})

@app.get("/api/health")
def health():
    return {"status" : "ok"}