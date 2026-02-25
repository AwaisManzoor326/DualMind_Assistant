import chromadb
from chromadb.utils import embedding_functions
import os

class VectorDBService:
    def __init__(self):
        # Persistent storage path
        self.db_path = os.path.join(os.getcwd(), "chroma_db")
        self.client = chromadb.PersistentClient(path=self.db_path)
        
        # Use a local embedding model
        # 'all-MiniLM-L6-v2' is a good balance of speed and performance
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.collection = self.client.get_or_create_collection(
            name="dualmind_docs",
            embedding_function=self.embedding_fn
        )
        print(f"DEBUG: VectorDB initialized. Current collection count: {self.collection.count()}")

    def add_documents(self, documents: list, metadatas: list, ids: list):
        """
        Adds documents to the ChromaDB collection.
        """
        print(f"DEBUG: Adding {len(documents)} docs to collection.")
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"DEBUG: Addition complete. New collection count: {self.collection.count()}")

    def query(self, query_text: str, n_results: int = 5, where: dict = None):
        """
        Queries the collection for similar documents with optional filtering.
        """
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where
        )
        return results

vector_db = VectorDBService()
