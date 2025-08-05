from pydantic import BaseModel

class AskRequest(BaseModel):
    session_id: str
    question: str
