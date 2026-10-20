from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from llm import extract_cv_info
from pdfExtractor import extract_text_pdf, looks_like_cv
from pathlib import Path
import uvicorn

BASE_DIR = Path(__file__).parent

app = FastAPI(
    title="CV Extractor",
    description="This is a simple API to extract information from CVs.",
    version="1.0.0"
)

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MegaBytes

app.mount("/static"
          , StaticFiles(directory=BASE_DIR / "static")
          , name = "static")

templates = Jinja2Templates(directory=BASE_DIR / "templates")

@app.get("/", response_class = HTMLResponse)
def index(request : Request):
    return templates.TemplateResponse(request = request, name = "index.html", context = {})

@app.get("/api/health")
def health():
    return {"status" : "ok"}

@app.post("/api/extract")
async def extract(request: Request, extension: str, confirm: bool = False) -> dict:
    file_bytes = await request.body()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and TXT files are allowed.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="The file exceeds the maximum size of 10 MB.")

    if extension == ".txt":
        text = file_bytes.decode("utf-8")
    else:
        try:
            text = extract_text_pdf(file_bytes)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error))

    if not confirm and not looks_like_cv(text):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "not_a_cv",
                "message": "This file does not seem to be a CV. Are you sure you want to continue?"
            }
        )

    response = extract_cv_info(text)
    print(response)
    return response


def main():

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main()