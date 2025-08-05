import chromadb
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings 
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
from dotenv import load_dotenv

load_dotenv()

CHROMA_PATH = "chroma_db"

# Use HuggingFace embeddings for local processing
EMBEDDINGS = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

def create_vectorstore(session_id: str, text: str):
    """Creates a new vector store for a session."""
    if not text or not text.strip():
        raise ValueError("Empty text provided for vector store creation")
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    
    # Filter out empty or very short chunks
    valid_chunks = []
    for chunk in chunks:
        if chunk and chunk.strip() and len(chunk.strip()) > 10:
            valid_chunks.append(chunk.strip())
    
    if not valid_chunks:
        raise ValueError("No valid chunks created from the text")

    documents = [Document(page_content=chunk) for chunk in valid_chunks]

    print(f"Creating vector store for session {session_id} with {len(documents)} chunks.")
    
    # Create the directory if it doesn't exist
    persist_dir = f"{CHROMA_PATH}/{session_id}"
    os.makedirs(persist_dir, exist_ok=True)
    
    try:
        Chroma.from_documents(
            documents=documents,
            embedding=EMBEDDINGS,
            persist_directory=persist_dir
        )
        print(f"Vector store for session {session_id} created successfully.")
    except Exception as e:
        print(f"Error creating vector store: {e}")
        raise

def get_vectorstore(session_id: str):
    """Retrieves an existing vector store for a session."""
    path = f"{CHROMA_PATH}/{session_id}"
    if not os.path.exists(path):
        print(f"Vector store path does not exist: {path}")
        return None

    try:
        return Chroma(
            embedding_function=EMBEDDINGS,
            persist_directory=path
        )
    except Exception as e:
        print(f"Error loading vector store: {e}")
        return None