import sys
import os
import json

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from autonomous_academy.schemas import SourceRef
from autonomous_academy.services import content
from autonomous_academy.llm import LLMClient

# Mock LLM Client
class MockLLM(LLMClient):
    def complete(self, prompt: str) -> str:
        if "READING_LIST_PROMPT" in prompt or "Curate a highly relevant reading list" in prompt:
            # Check if context is injected
            if "Context from Web Search" in prompt:
                print("SUCCESS: Search context injected into prompt.")
            else:
                print("FAILURE: Search context missing.")
            
            # Return a mock response that mimics using the context
            return """
            [
                {"id": "s1", "title": "Real Doc", "url": "https://docs.python.org/3/"},
                {"id": "s2", "title": "Good Tutorial", "url": "https://realpython.com/"}
            ]
            """
        return "[]"

    def parse_json(self, text: str):
        return json.loads(text)

def test_reading_list():
    llm = MockLLM()
    topic = "Python Asyncio"
    objectives = ["Understand async/await", "Event loops"]
    outline = ["Intro", "Event Loop", "Couroutines"]
    audience = "Intermediate"

    print(f"Testing reading list generation for: {topic}")
    
    # We expect this to run DDGS searches (which might fail in this env if no internet, but code handles exception)
    # and then call LLM.
    
    sources = content.generate_reading_list(topic, objectives, outline, audience, llm)
    
    print(f"Generated {len(sources)} sources.")
    for s in sources:
        print(f" - {s.title}: {s.url}")
        if "google.com/search" in s.url:
            print("WARNING: Found google search link!")

if __name__ == "__main__":
    test_reading_list()
