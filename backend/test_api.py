import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_token = os.getenv("HF_API_TOKEN")
if not api_token:
    print("Error: HF_API_TOKEN not found in .env")
    exit(1)

headers = {"Authorization": f"Bearer {api_token}"}

models_to_test = [
    "Qwen/Qwen2.5-7B-Instruct",
]

base_urls = [
    "https://api-inference.huggingface.co/models/",
    "https://router.huggingface.co/hf-inference/models/",
    "https://router.huggingface.co/models/",
    "https://ui.huggingface.co/api/models/"
]

print(f"Testing API with token: {api_token[:4]}...{api_token[-4:]}")

for model in models_to_test:
    for base in base_urls:
        print(f"\nTesting URL Base: {base}")
        print(f"Testing model: {model}")
        url = f"{base}{model}"
        payload = {"inputs": "Hi"}
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print("Success!")
                print(f"Response: {response.json()[:50]}...")
                print(f"!!! WORKING URL FOUND: {base} !!!")
                break
            else:
                print(f"Error: {response.text[:100]}...")
        except Exception as e:
            print(f"Exception: {e}")
