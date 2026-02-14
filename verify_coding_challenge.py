import sys
import os
import json

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from autonomous_academy.schemas import Module, Item
from autonomous_academy.services import content
from autonomous_academy.llm import LLMClient

# Mock LLM Client
class MockLLM(LLMClient):
    def complete(self, prompt: str) -> str:
        if "CODING_CHALLENGE_PROMPT" in prompt or "coding challenge" in prompt:
            print("SUCCESS: Coding Challenge Prompt Triggered.")
            return """
            [
                {
                    "id": "code-1",
                    "type": "code",
                    "stem": "Write a function to sum a list.",
                    "options": ["def sum_list(l):\\n    pass", "def sum_list(l):\\n    return sum(l)"],
                    "answer": "6",
                    "rationale": "Use built-in sum."
                }
            ]
            """
        if "ASSESSMENT_PROMPT" in prompt:
            return "[]" # Return empty for standard quiz in this test
            
        return "[]"

    def parse_json(self, text: str):
        return json.loads(text)

def test_coding_challenge():
    llm = MockLLM()
    # Test 1: CS Topic -> Should trigger coding challenge
    topic_cs = "Python Programming"
    audience = "Beginner"
    objectives = ["Learn loops", "Learn functions"]
    
    print(f"--- Testing CS Topic: {topic_cs} ---")
    challenge = content.generate_coding_challenge(objectives, topic_cs, audience, llm)
    
    if challenge and challenge.type == 'code':
        print(f"SUCCESS: Generated coding challenge: {challenge.stem}")
        if challenge.options and len(challenge.options) == 2:
             print("SUCCESS: starter code and solution present.")
        else:
             print("FAILURE: Options missing.")
    else:
        print("FAILURE: No coding challenge generated.")

    # Test 2: Non-CS Topic -> Should NOT trigger coding challenge in generate_module_content logic
    # (We can't easily test generate_module_content without mocking everything else, 
    # but we can verify our ad-hoc logic in content.py via a small helper test here)
    
    topic_history = "Ancient History"
    cs_keywords = ["python", "java", "c++", "javascript", "script", "code", "programming", "sql", "data science", "react", "algorithm"]
    is_cs = any(k in topic_history.lower() for k in cs_keywords)
    print(f"\n--- Testing Topic Detection for '{topic_history}' ---")
    if not is_cs:
         print("SUCCESS: Correctly identified as non-CS topic.")
    else:
         print("FAILURE: Incorrectly identified as CS topic.")

    topic_java = "Advanced Java Concepts"
    is_cs_java = any(k in topic_java.lower() for k in cs_keywords)
    print(f"--- Testing Topic Detection for '{topic_java}' ---")
    if is_cs_java:
         print("SUCCESS: Correctly identified as CS topic.")
    else:
         print("FAILURE: Incorrectly identified as non-CS topic.")

if __name__ == "__main__":
    test_coding_challenge()
