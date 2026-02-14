from autonomous_academy.llm import LLMClient
import json

def test_json_parsing():
    print("Testing JSON parsing with Nemotron...")
    llm = LLMClient()
    
    # Simulate a prompt that expects JSON
    prompt = """
    Create a course charter for a 'Python for Data Science' course.
    Respond with a valid JSON object matching this schema:
    {
        "audience": "string",
        "outcomes": ["string"],
        "prerequisites": ["string"],
        "time_budget_hours": 10,
        "tone": "string",
        "constraints": ["string"],
        "open_questions": ["string"]
    }
    """
    
    print("Sending prompt...")
    try:
        response = llm.complete(prompt)
        print(f"Raw response length: {len(response)}")
        print(f"Raw response preview: {response[:200]}...")
        
        data = llm.parse_json(response)
        print("Successfully parsed JSON:")
        print(json.dumps(data, indent=2))
        
    except Exception as e:
        print(f"Test FAILED: {e}")

if __name__ == "__main__":
    test_json_parsing()
