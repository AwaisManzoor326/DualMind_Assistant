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

    def add_documents(self, documents: list, metadatas: list, ids: list):
        """
        Adds documents to the ChromaDB collection.
        """
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def query(self, query_text: str, n_results: int = 5):
        """
        Queries the collection for similar documents.
        """
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results

vector_db = VectorDBService()
