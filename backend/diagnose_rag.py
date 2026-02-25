import asyncio
import sys
import os

# Add parent directory to path to allow imports from app
sys.path.append(os.getcwd())

from app.services.rag_service import rag_service
from app.services.vector_db import vector_db

async def diagnose():
    print("--- RAG DIAGNOSTIC START ---")
    
    # 1. Check current collection count
    try:
        count = vector_db.collection.count()
        print(f"Current collection count: {count}")
    except Exception as e:
        print(f"Error checking collection count: {e}")
        return

    # 2. Test indexing
    test_text = "The capital of Pakistan is Islamabad. It is a beautiful city located in the Potohar Plateau."
    test_filename = "test_diagnose.txt"
    with open(test_filename, "w") as f:
        f.write(test_text)
    
    print("\nProcessing document...")
    try:
        result = await rag_service.process_document(test_filename, test_filename)
        print(f"Processing result: {result}")
    except Exception as e:
        print(f"Error processing document: {e}")
    
    # 3. Test search
    print("\nSearching for 'Islamabad'...")
    try:
        results = rag_service.search("Islamabad")
        print(f"Search results: {results}")
        if len(results) > 0:
            print("SUCCESS: RAG search returned results!")
        else:
            print("FAILURE: RAG search returned no results.")
    except Exception as e:
        print(f"Error during search: {e}")

    # Cleanup
    if os.path.exists(test_filename):
        os.remove(test_filename)
    
    print("\n--- RAG DIAGNOSTIC END ---")

if __name__ == "__main__":
    asyncio.run(diagnose())
