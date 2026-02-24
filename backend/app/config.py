import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HF_API_TOKEN = os.getenv("HF_API_TOKEN")
    MODEL_ID_1 = os.getenv("MODEL_ID_1", "Qwen/Qwen2.5-7B-Instruct")
    MODEL_ID_2 = os.getenv("MODEL_ID_2", "meta-llama/Llama-3.2-3B-Instruct")
    
    if not HF_API_TOKEN:
        print("WARNING: HF_API_TOKEN is not set in .env file")

config = Config()
