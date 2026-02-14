
from autonomous_academy.llm import LLMClient
import os

def test_llm():
    print("Testing LLM Client...")
    # Check API Key environment variable
    api_key = os.getenv("NVIDIA_API_KEY")
    if api_key:
        print(f"NVIDIA_API_KEY found: {api_key[:10]}...")
    else:
        print("NVIDIA_API_KEY not set in environment, using default/hardcoded.")

    client = LLMClient()
    print(f"Provider: {client.provider}")
    print(f"Model: {client.model_name}")
    
    prompt = "Say hello!"
    print(f"Sending prompt: {prompt}")
    
    try:
        response = client.complete(prompt)
        print(f"Response: {response}")
    except Exception as e:
        print(f"Exception during complete: {e}")

if __name__ == "__main__":
    test_llm()
