
from autonomous_academy.llm import LLMClient
from autonomous_academy.services import content
from autonomous_academy.schemas import Module, SourceRef

def debug_lesson():
    print("Initializing LLM...")
    llm = LLMClient()
    
    module = Module(
        id="mod-debug",
        title="Advanced Python Generators",
        objectives=["Understand `yield`", "Create infinite sequences", "Build data pipelines"],
        duration_minutes=60,
        dependencies=[],
        checkpoints=["Quiz"],
        references=[SourceRef(id="s1", title="Python Docs", url="https://docs.python.org")]
    )
    
    print(f"Generating Lesson Content for: {module.title}...")
    
    # We call generate_lesson directly, as that's where the content_md comes from
    lesson = content.generate_lesson(module, tone="Professional", llm=llm)
    
    print("\n--- GENERATED CONTENT START ---")
    print(lesson.content_md)
    print("--- GENERATED CONTENT END ---")
    
    print(f"\nContent Length: {len(lesson.content_md)} chars")
    
    if len(lesson.content_md) < 500:
        print("FAILURE: Content is suspiciously short.")
    elif "Placeholder" in lesson.content_md:
        print("FAILURE: Placeholder content detected.")
    else:
        print("SUCCESS: Content seems substantial.")

if __name__ == "__main__":
    debug_lesson()
