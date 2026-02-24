import os
from typing import List, Dict
from app.services.vector_db import vector_db
import uuid
# Import for file handling - we might need to add logic for PDF/Docx here later
# but for now we will structure the service.

class RAGService:
    def __init__(self):
        pass

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Simple overlapping chunking strategy.
        For 'semantic chunking' we might want to use a more advanced library later,
        but for teaching, a sliding window is a good start.
        """
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap # Move forward by size - overlap
        
        return chunks

    def read_pdf(self, file_path: str) -> str:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text

    def read_docx(self, file_path: str) -> str:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    def read_text(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    async def process_document(self, file_path: str, filename: str):
        """
        Processes a document based on its extension: chunk it, and add to vector DB.
        """
        ext = filename.split('.')[-1].lower()
        if ext == 'pdf':
            content = self.read_pdf(file_path)
        elif ext in ['docx', 'doc']:
            content = self.read_docx(file_path)
        else:
            content = self.read_text(file_path)
            
        chunks = self.chunk_text(content)
        
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]
        
        # Add to Vector DB
        # Note: Embedding happens inside vector_db.add_documents via the embedding function
        vector_db.add_documents(documents=chunks, metadatas=metadatas, ids=ids)
        
        return {"chunks_processed": len(chunks), "ids": ids}

    def search(self, query: str, k: int = 3):
        """
        Searches for relevant context.
        """
        results = vector_db.query(query, n_results=k)
        
        # Format results
        # Chroma returns lists of lists (one list per query)
        if not results['documents']:
            return []
            
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        distances = results['distances'][0] if results['distances'] else []
        
        formatted_results = []
        for i in range(len(documents)):
            formatted_results.append({
                "content": documents[i],
                "metadata": metadatas[i],
                "score": distances[i] if i < len(distances) else None
            })
            
        return formatted_results

rag_service = RAGService()
