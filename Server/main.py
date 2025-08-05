from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
import os

from pdf_parser import extract_text
from vector_store import create_vectorstore, get_vectorstore
from chat_engine import ask_question

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    session_id: str
    question: str

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text(content)

    session_id = str(uuid4())
    create_vectorstore(session_id, text)

    return {"session_id": session_id}

@app.post("/ask")
async def ask(req: AskRequest):
    response = ask_question(req.session_id, req.question)
    return {"response": response}
