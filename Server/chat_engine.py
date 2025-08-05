from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI
from vector_store import get_vectorstore
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-pro",
    google_api_key=os.getenv("GEMINI_API_KEY")
)

custom_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a highly intelligent AI assistant specialized in reading and understanding PDF documents, especially legal, academic, technical, and business documents. Your goal is to provide accurate, helpful, and clear answers to user queries based on the document content only.

Rules:
- Always answer **based only** on the content in the provided document.
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
    store = get_vectorstore(session_id)
    if not store:
        return "Session not found. Upload a PDF first."

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=store.as_retriever(),
        chain_type_kwargs={"prompt": custom_prompt}
    )

    return qa.run(question)
