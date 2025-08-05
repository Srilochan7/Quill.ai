from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os

load_dotenv()

embedding = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

vectorstore_cache = {}

def create_vectorstore(session_id: str, text: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.create_documents([text])
    db = FAISS.from_documents(docs, embedding)
    vectorstore_cache[session_id] = db

def get_vectorstore(session_id: str):
    return vectorstore_cache.get(session_id)
