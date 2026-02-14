import sys
import os
import json

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from autonomous_academy.schemas import Module, Item, ProjectBrief, Charter, SourceRef
from autonomous_academy.services import content
from autonomous_academy.llm import LLMClient

# Mock LLM Client
class MockLLM(LLMClient):
    def complete(self, prompt: str) -> str:
        if "SYLLABUS_PROMPT" in prompt or "detailed course syllabus" in prompt:
            # Extract count from prompt to verify it's being passed
            import re
            match = re.search(r"EXACTLY (\d+) modules", prompt)
            count = int(match.group(1)) if match else 5
            
            modules = []
            for i in range(count):
                modules.append({
                    "id": f"mod-{i}",
                    "title": f"Module {i}",
                    "objectives": ["Obj 1"],
                    "duration_minutes": 60,
                    "dependencies": [],
                    "checkpoints": []
                })
            return json.dumps(modules)
            
        if "ASSESSMENT_PROMPT" in prompt or "assessment items" in prompt:
            return """
            [
                {
                    "id": "q1",
                    "type": "mcq",
                    "stem": "Bridge question?",
                    "options": ["A", "B"],
                    "answer": "A",
                    "rationale": "Bridging to next topic"
                }
            ]
            """
        if "PROJECT_PROMPT" in prompt or "CAPSTONE PROJECT" in prompt:
            return """
            {
                "title": "Capstone Part 1",
                "scenario": "Build part of the system.",
                "deliverables": ["Code"],
                "rubric": {
                    "criteria": [{"criterion": "C1", "weight": 1, "levels": ["A"]}],
                    "reference_answer": "Ref"
                }
            }
            """
        return "{}"

    def parse_json(self, text: str):
        return json.loads(text)

def test_refinements():
    llm = MockLLM()
    sources = [SourceRef(id="s1", title="Ref", url="http://example.com")]
    charter = Charter(
        id="c1", audience="Beginner", outcomes=["Learn"], 
        time_budget_hours=10, tone="Supportive"
    )

    print("--- Testing Syllabus Module Counts ---")
    
    # Test 5 Modules
    print("\nTesting 5 Modules count...")
    mods_5 = content.generate_syllabus(charter, sources, module_count=5, llm=llm)
    print(f"Generated {len(mods_5)} modules. Expected 5.")
    assert len(mods_5) == 5

    # Test 24 Modules
    print("\nTesting 24 Modules count...")
    mods_24 = content.generate_syllabus(charter, sources, module_count=24, llm=llm)
    print(f"Generated {len(mods_24)} modules. Expected 24.")
    assert len(mods_24) == 24

    print("\n--- Testing Content Generation Prompts ---")
    # We can't easily check the *prompt* text here without spying on the LLM class, 
    # but the MockLLM logic relies on specific phrases in the prompt to return data.
    # If "CAPSTONE PROJECT" isn't in the prompt, MockLLM returns "{}".
    
    module = mods_5[0]
    # Check Project Prompt
    project = content.generate_project(module.objectives, 45, llm)
    if project and project.title == "Capstone Part 1":
        print("SUCCESS: Project prompt contained 'CAPSTONE PROJECT' keyword.")
    else:
        print("FAILURE: Project prompt did not trigger Capstone logic.")

    # Check Assessment Prompt (Bridging)
    # Mock return implies success if it matched "assessment items"
    quiz = content.generate_quiz(module.objectives, 3, llm)
    if quiz:
        print("SUCCESS: Quiz generated.")
    else:
        print("FAILURE: Quiz generation failed.")

if __name__ == "__main__":
    test_refinements()
