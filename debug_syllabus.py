
from autonomous_academy.llm import LLMClient
from autonomous_academy.services import content
from autonomous_academy.schemas import Charter, SourceRef

def debug_syllabus():
    print("Initializing LLM...")
    llm = LLMClient()
    
    charter = Charter(
        id="test-charter",
        audience="Beginner Python Students",
        outcomes=["Learn Syntax", "Write scripts"],
        prerequisites=[],
        time_budget_hours=10,
        tone="Encouraging",
        constraints=[],
        sources=[SourceRef(id="s1", title="Python Docs", url="https://docs.python.org")]
    )
    
    print("Generating Syllabus...")
    # I'm calling the function but I also want to see the RAW output if it fails.
    # Since generate_syllabus swallows the exception and prints it, I should see it in stdout.
    
    modules = content.generate_syllabus(charter, charter.sources, module_count=5, llm=llm)
    
    print(f"\nGenerated {len(modules)} modules.")
    for m in modules:
        print(f"- {m.title}")
        
    if "Fallback" in modules[0].title:
        print("\nFAILURE: Fallback content detected.")
    else:
        print("\nSUCCESS: Real content generated.")

if __name__ == "__main__":
    debug_syllabus()
