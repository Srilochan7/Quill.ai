import chromadb
from langchain_community.vectorstores import Chroma
# V-- NEW IMPORT
from langchain_huggingface import HuggingFaceEmbeddings 
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PATH = "chroma_db"

# --- REPLACED EMBEDDINGS ---
# This line replaces your GoogleGenerativeAIEmbeddings
EMBEDDINGS = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",
    model_kwargs={'device': 'cpu'}, # Run on CPU
    encode_kwargs={'normalize_embeddings': True} # Set to True for BGE models
)
# -------------------------

def create_vectorstore(session_id: str, text: str):
    """Creates a new vector store for a session."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(text)
    chunks = [chunk for chunk in chunks if chunk and 'undefined' not in chunk.lower()]


    documents = [Document(page_content=chunk) for chunk in chunks]

    print(f"Creating vector store for session {session_id} with {len(documents)} chunks.")
    
    # This function now runs entirely locally and will be much faster
    Chroma.from_documents(
        documents=documents,
        embedding=EMBEDDINGS,
        persist_directory=f"{CHROMA_PATH}/{session_id}"
    )
    
    print(f"Vector store for session {session_id} created successfully.")

def get_vectorstore(session_id: str):
    """Retrieves an existing vector store for a session."""
    path = f"{CHROMA_PATH}/{session_id}"
    if not os.path.exists(path):
        return None

    return Chroma(
        embedding_function=EMBEDDINGS,
        persist_directory=path
    )