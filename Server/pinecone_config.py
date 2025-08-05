import pinecone
import os 
from dotenv import load_dotenv 

load_dotenv

pinecone.init(api_key = os.getenv("PINECONE_API_KEY"), environment=PINECO)