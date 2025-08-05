from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pdf_parser import extract_text
from vectorstore import create_vectorstore
from chat import ask_question
from models import AskRequest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_pdf(session_id: str, file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text(content)
    create_vectorstore(session_id, text)
    return {"message": f"PDF uploaded for session {session_id}"}

@app.post("/ask")
async def ask(req: AskRequest):
    response = ask_question(req.session_id, req.question)
    return {"response": response}
