from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel
from app.services.llm_service import llm_service

from app.routers import chat, documents

from app.database import create_db_and_tables

app = FastAPI(title="DualMind Assistant Backend")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# CORS Setup
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(documents.router)

class ChatRequest(BaseModel):
    message: str
    model: str = "qwen"

@app.get("/")
async def root():
    return {"message": "DualMind Assistant Backend Running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    response = await llm_service.generate_response(request.message, request.model)
    return {"response": response, "model_used": request.model}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
