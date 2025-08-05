import random
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI
from vector_store import get_vectorstore
import os
from dotenv import load_dotenv

load_dotenv()

api_keys = os.getenv("GEMINI_API_KEYS", "")
api_keys_list = [key.strip() for key in api_keys.split(",") if key.strip()]

if not api_keys_list:
    raise ValueError("❌ No GEMINI_API_KEYS found in .env")

# Choose one (random or first)
selected_key = random.choice(api_keys_list)

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=selected_key
)

# Custom prompt to keep the answers PDF-focused
custom_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a highly intelligent AI assistant specialized in reading and understanding PDF documents, especially legal, academic, technical, and business documents. Your goal is to provide accurate, helpful, and clear answers to user queries based on the document content only.

Rules:
- Answer in less than 10 words.
- Always answer **based only** on the content in the provided document 
- If the information is not available in the document, respond: **"The information is not available in the PDF."**
- Maintain the **original tone** of the document if possible.
- When referencing the PDF, use phrases like "According to the document..." or "As mentioned in the PDF..."
- If the user asks for a summary, include the key sections, bullet points, and main themes.
- For dates, definitions, or factual data, quote exactly from the PDF.
- If multiple interpretations are possible, explain them all.

PDF Content:
{context}

Question:
{question}

Answer:
"""
)

def ask_question(session_id: str, question: str) -> str:
    """Ask a question using a session's vectorstore"""
    store = get_vectorstore(session_id)
    if not store:
        return "Session not found. Upload a PDF first."

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=store.as_retriever(search_kwargs={"k": 4}),  # Return top 4 most relevant chunks
        chain_type_kwargs={"prompt": custom_prompt}
    )

    try:
        return qa.run(question)
    except Exception as e:
        return f"Error processing question: {str(e)}"