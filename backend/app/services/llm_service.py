from huggingface_hub import AsyncInferenceClient
import json
from app.config import config

class LLMService:
    def __init__(self):
        self.client = AsyncInferenceClient(token=config.HF_API_TOKEN)

    async def generate_response(self, prompt: str, model: str = "qwen", max_new_tokens: int = 512):
        """
        Generates a full response from the selected model (non-streaming).
        """
        # Select model ID based on input
        if model.lower() == "llama":
            model_id = config.MODEL_ID_2
        else:
            model_id = config.MODEL_ID_1 

        messages = [{"role": "user", "content": prompt}]
        
        try:
            response = await self.client.chat_completion(
                messages, 
                model=model_id, 
                max_tokens=max_new_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error from API: {str(e)}"

    async def generate_stream(self, prompt: str, model: str = "qwen", max_new_tokens: int = 512):
        """
        Generates a streaming response from the selected model.
        """
        # Select model ID based on input
        if model.lower() == "llama":
            model_id = config.MODEL_ID_2
        else:
            model_id = config.MODEL_ID_1 

        messages = [{"role": "user", "content": prompt}]

        try:
            stream = await self.client.chat_completion(
                messages, 
                model=model_id, 
                max_tokens=max_new_tokens,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error from API: {str(e)}"

llm_service = LLMService()
