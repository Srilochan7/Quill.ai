# from langchain.prompts import PromptTemplate
# from langchain.chains import RetrievalQA
# from langchain_google_genai import ChatGoogleGenerativeAI
# from vector_store import get_vectorstore
# import os
# from dotenv import load_dotenv

# load_dotenv()

# # Initialize Gemini LLM
# llm = ChatGoogleGenerativeAI(
#     model="gemini-1.5-flash",
#     google_api_key=os.getenv("GEMINI_API_KEY")
# )

# # Custom prompt to keep the answers PDF-focused
# custom_prompt = PromptTemplate(
#     input_variables=["context", "question"],
#     template="""
# You are a highly intelligent AI assistant specialized in reading and understanding PDF documents, especially legal, academic, technical, and business documents. Your goal is to provide accurate, helpful, and clear answers to user queries based on the document content only.

# Rules:
# - answer in less than 10 words.
# - Always answer **based only** on the content in the provided document
# - If the information is not available in the document, respond: **"The information is not available in the PDF."**
# - Maintain the **original tone** of the document if possible.
# - When referencing the PDF, use phrases like "According to the document..." or "As mentioned in the PDF..."
# - If the user asks for a summary, include the key sections, bullet points, and main themes.
# - For dates, definitions, or factual data, quote exactly from the PDF.
# - If multiple interpretations are possible, explain them all.

# PDF Content:
# {context}

# Question:
# {question}

# Answer:
# """
# )

# def ask_question(session_id: str, question: str) -> str:
#     """Ask a question using a session's vectorstore"""
#     store = get_vectorstore(session_id)
#     if not store:
#         return "Session not found. Upload a PDF first."

#     qa = RetrievalQA.from_chain_type(
#         llm=llm,
#         chain_type="stuff",
#         retriever=store.as_retriever(search_kwargs={"k": 1}),  # Return top 4 most relevant chunks
#         chain_type_kwargs={"prompt": custom_prompt}
#     )

#     try:
#         return qa.run(question)
#     except Exception as e:
#         return f"Error processing question"



from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from vector_store import get_vectorstore
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq LLM with Mixtral model
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama3-8b-8192"  # Use this for a fast and effective model
)

# Custom prompt to keep the answers PDF-focused
# This part remains unchanged
custom_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are a highly intelligent AI assistant specialized in reading and understanding PDF documents, especially legal, academic, technical, and business documents. Your goal is to provide accurate, helpful, and clear answers to user queries based on the document content only.

Rules:
- answer in less than 10 words.
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

    # This part remains unchanged
    qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=store.as_retriever(search_kwargs={"k": 1}),
        chain_type_kwargs={"prompt": custom_prompt}
    )

    try:
        # qa.run() is deprecated, prefer qa.invoke()
        result = qa.invoke({"query": question})
        if isinstance(result, dict) and 'result' in result:
            return result['result'].strip().lstrip('.,:;')
        return str(result).strip().lstrip('.,:;')

    except Exception as e:
        return f"Error processing question: {e}"