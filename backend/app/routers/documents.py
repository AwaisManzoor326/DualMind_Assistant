from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.rag_service import rag_service
import shutil
import os

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads a document and processes it for RAG.
    """
    try:
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process the file
        result = await rag_service.process_document(file_location, file.filename)
        
        return {"filename": file.filename, "status": "processed", "chunks": result["chunks_processed"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
