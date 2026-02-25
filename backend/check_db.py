from sqlmodel import Session, select
from app.database import engine
from app.models import ChatSession, Message

def check_db():
    print("--- DATABASE CHECK ---")
    with Session(engine) as session:
        # Check sessions
        sessions = session.exec(select(ChatSession)).all()
        print(f"Total Sessions: {len(sessions)}")
        for s in sessions:
            print(f"ID: {s.id} | Title: {s.title} | Source: {s.source_file}")
            
        # Check messages
        messages = session.exec(select(Message)).all()
        print(f"\nTotal Messages: {len(messages)}")
        for i, m in enumerate(messages[-10:]): # Last 10
            print(f"[{i}] SessID: {m.session_id} | Role: {m.role} | Content: {m.content[:50]}...")
    print("--- END CHECK ---")

if __name__ == "__main__":
    check_db()
