import requests
import json

base_url = "http://localhost:8000/api/chat"

# 1. Create Session
try:
    print("Creating session...")
    sess_res = requests.post(f"{base_url}/sessions", json={"title": "Debug Chat"})
    print(f"Session Create Status: {sess_res.status_code}")
    print(f"Session Response: {sess_res.text}")
    session_id = sess_res.json()['id']
except Exception as e:
    print(f"Failed to create session: {e}")
    session_id = 1 # Fallback

# 2. Send Chat
url = f"{base_url}/stream"
payload = {
    "message": "test",
    "model": "qwen",
    "use_rag": False, # Disable RAG to isolate DB vs RAG
    "session_id": session_id
}

try:
    print(f"Sending request to {url} with payload: {payload}")
    response = requests.post(url, json=payload, stream=True)
    
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    
    # Read chunk by chunk to catch streaming errors
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:
            print(chunk.decode('utf-8'))

except Exception as e:
    print(f"Request failed: {e}")
