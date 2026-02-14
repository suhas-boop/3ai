
from autonomous_academy.llm import LLMClient
from autonomous_academy.services import content
from autonomous_academy.schemas import Charter, SourceRef
import time

def debug_syllabus_semester():
    print("Initializing LLM...")
    llm = LLMClient()
    
    charter = Charter(
        id="test-charter-adv",
        audience="Advanced Students",
        outcomes=["Master Advanced Concepts", "Build Portfolio"],
        prerequisites=["Intermediate Python"],
        time_budget_hours=160,
        tone="Professional",
        constraints=["Semester structure", "Exactly 48 modules"],
        sources=[SourceRef(id="s1", title="Python Docs", url="https://docs.python.org")]
    )
    
    module_count = 48
    print(f"Generating Syllabus with {module_count} modules...")
    
    start_time = time.time()
    modules = content.generate_syllabus(charter, charter.sources, module_count=module_count, llm=llm)
    end_time = time.time()
    
    print(f"\nTime taken: {end_time - start_time:.2f}s")
    print(f"Generated {len(modules)} modules.")
    
    fallback_count = sum(1 for m in modules if "Fallback" in m.title)
    if fallback_count > 0:
        print(f"\nFAILURE: {fallback_count} modules used fallback content.")
    else:
        print("\nSUCCESS: All modules generated correctly.")

if __name__ == "__main__":
    debug_syllabus_semester()
