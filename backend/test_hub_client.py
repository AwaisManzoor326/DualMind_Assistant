from huggingface_hub import InferenceClient
import os
from dotenv import load_dotenv

load_dotenv()

api_token = os.getenv("HF_API_TOKEN")
model_id = "Qwen/Qwen2.5-7B-Instruct"

print(f"Testing huggingface_hub Client with model: {model_id}")

client = InferenceClient(token=api_token)

try:
    print("Sending request...")
    messages = [{"role": "user", "content": "Hi, are you working?"}]
    response = client.chat_completion(
        messages, 
        model=model_id, 
        max_tokens=50
    )
    print("Success!")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"Error: {e}")
