from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import asyncio
from pydantic import BaseModel
from typing import Optional
from app.services.llm_service import llm_service
from app.services.rag_service import rag_service
from sqlmodel import Session, select
from app.database import engine
from app.models import ChatSession, Message

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    model: str = "qwen"
    use_rag: bool = False
    session_id: Optional[int] = None

# --- Session Management Endpoints ---

@router.post("/sessions")
async def create_session(title: str = "New Chat"):
    with Session(engine) as session:
        chat_session = ChatSession(title=title)
        session.add(chat_session)
        session.commit()
        session.refresh(chat_session)
        return chat_session

@router.get("/sessions")
async def get_sessions():
    with Session(engine) as session:
        statement = select(ChatSession).order_by(ChatSession.created_at.desc())
        sessions = session.exec(statement).all()
        return sessions

@router.get("/sessions/{session_id}")
async def get_session_history(session_id: int):
    with Session(engine) as session:
        statement = select(Message).where(Message.session_id == session_id).order_by(Message.timestamp)
        messages = session.exec(statement).all()
        return messages

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int):
     with Session(engine) as session:
        chat_session = session.get(ChatSession, session_id)
        if not chat_session:
            raise HTTPException(status_code=404, detail="Session not found")
        session.delete(chat_session)
        session.commit()
        return {"ok": True}

# --- Chat Endpoints ---

async def generate_title(session_id: int):
    """
    Generates a short title for the session based on the first user message and assistant response.
    """
    try:
        with Session(engine) as session:
            # Check if title is already set (not "New Chat")
            chat_session = session.get(ChatSession, session_id)
            if not chat_session or chat_session.title != "New Chat":
                return

            # Get first few messages
            messages = session.exec(select(Message).where(Message.session_id == session_id).order_by(Message.timestamp).limit(2)).all()
            if not messages:
                return
            
            context = "\n".join([f"{m.role}: {m.content}" for m in messages])
            prompt = f"Summarize the following conversation into a very short title (max 5 words). Do not use quotes.\n\n{context}\n\nTitle:"
            
            title = await llm_service.generate_response(prompt, max_new_tokens=20)
            title = title.strip().strip('"').strip("'")
            
            chat_session.title = title
            session.add(chat_session)
            session.commit()
            print(f"Updated session {session_id} title to: {title}")
    except Exception as e:
        print(f"Error generating title: {e}")

@router.post("/stream")
async def chat_stream_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    try:
        # Ensure session exists or create one if missing (optional logic, usually frontend provides ID)
        if not request.session_id:
             pass
        
        # 1. Retrieve History for specific session
        history_context = ""
        if request.session_id:
            with Session(engine) as session:
                statement = select(Message).where(Message.session_id == request.session_id).order_by(Message.timestamp.desc()).limit(10)
                messages = session.exec(statement).all()
                for msg in messages[::-1]: # Oldest first
                    history_context += f"{msg.role}: {msg.content}\n"
    
        # Custom Identity & System Instructions
        system_instruction = (
            "You are DualMind Assistant, a powerful AI companion. "
            "You were created by Awais Manzoor, a 20-year-old Computer Science student at the University of Azad Jammu and Kashmir (UAJK), Muzaffarabad. "
            "You have two main modes: General Chat mode and RAG (Retrieval-Augmented Generation) mode. "
            "You are powered by two state-of-the-art models: Llama 3.2 and Qwen 2.5. "
            "When asked about your identity or creator, always mention Awais Manzoor and his background at UAJK.\n\n"
        )

        # 2. RAG Context (unchanged)
        context = ""
        rag_chunks_count = 0
        if request.use_rag:
            results = rag_service.search(request.message, k=3)
            if results:
                rag_chunks_count = len(results)
                context = "\n\n".join([r['content'] for r in results])
                prompt = f"{system_instruction}History:\n{history_context}\n\nContext:\n{context}\n\nQuestion: {request.message}\n\nAnswer:"
            else:
                 prompt = f"{system_instruction}History:\n{history_context}\n\nQuestion: {request.message}\n\nAnswer:"
        else:
            prompt = f"{system_instruction}History:\n{history_context}\n\nQuestion: {request.message}\n\nAnswer:"
    
        # 3. Save User Message
        if request.session_id:
            with Session(engine) as session:
                user_msg = Message(role="user", content=request.message, session_id=request.session_id)
                session.add(user_msg)
                session.commit()
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in chat_stream_endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    async def stream_generator():
        try:
            full_response = ""
            async for chunk in llm_service.generate_stream(prompt, request.model):
                full_response += chunk
                yield chunk
            
            # 4. Save Assistant Message
            if request.session_id:
                with Session(engine) as session:
                    asst_msg = Message(role="assistant", content=full_response, session_id=request.session_id)
                    session.add(asst_msg)
                    session.commit()
                
                # Trigger title generation in background
                asyncio.create_task(generate_title(request.session_id))
            
            # 5. Send Metrics
            import json
            metrics = {
                "rag_chunks": rag_chunks_count,
                "latency_ms": 0 # Backend latency stub, frontend calculates total
            }
            yield f"\n\n[METRICS: {json.dumps(metrics)}]"

        except Exception as e:
             print(f"Error during streaming: {e}")
             yield f"\n\n[System Error: {str(e)}]"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
