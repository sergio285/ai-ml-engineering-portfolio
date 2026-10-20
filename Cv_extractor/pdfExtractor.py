import re
import pymupdf

MIN_TEXT_LENGTH = 100
MIN_CV_KEYWORDS = 5

CV_KEYWORDS = {
    "curriculum", "curriculum vitae", "currículum", "currículum vitae", "cv", "resume", "résumé", "hoja de vida",
    "experience", "work experience", "experiencia", "experiencia laboral", "experiencia profesional",
    "education", "educación", "educacion", "formación", "formacion", "formación académica", "estudios",
    "skills", "habilidades", "competencias", "conocimientos",
    "languages", "idiomas", "lenguajes",
    "projects", "proyectos",
    "certifications", "certificates", "certificaciones", "certificados",
    "summary", "professional summary", "profile", "resumen", "resumen profesional", "perfil", "perfil profesional",
    "objective", "objetivo",
    "employment", "empleo", "trabajo",
    "university", "universidad", "bachelor", "licenciatura", "degree", "grado", "título", "titulo",
    "master", "máster", "maestría", "maestria", "ingeniería", "ingenieria", "engineer", "ingeniero",
    "developer", "desarrollador", "analyst", "analista", "manager", "gerente", "intern", "practicante",
    "responsibilities", "responsabilidades", "achievements", "logros",
    "references", "referencias",
    "email", "correo", "phone", "teléfono", "telefono", "linkedin", "github", "portfolio", "portafolio",
    "technologies", "tecnologías", "tecnologias", "tools", "herramientas",
    "present", "actualidad", "actual",
}

def extract_text_pdf(file_bytes:bytes) -> str:
    with pymupdf.open(
        stream= file_bytes,
        filetype="pdf"
    ) as document:
        text = "\n".join(
            page.get_text("text") for page in document
        )

    if len(text.strip()) < MIN_TEXT_LENGTH:
        raise ValueError("The PDF has no readable text. Scanned PDFs (images) are not supported.")

    return text

def looks_like_cv(text:str) -> bool:
    normalized = " " + " ".join(re.findall(r"\w+", text.lower())) + " "
    matches = sum(
        1 for keyword in CV_KEYWORDS
        if (" " + keyword + " ") in normalized
    )
    return matches >= MIN_CV_KEYWORDS
