
from autonomous_academy.llm import LLMClient
from autonomous_academy.services import content
from autonomous_academy.schemas import Module, SourceRef

def test_content_generation():
    print("Initializing LLM...")
    llm = LLMClient()
    
    print("\n--- Testing Lesson Generation ---")
    module = Module(id="mod-1", title="Python Basics", objectives=["Learn variables"], references=[])
    lesson = content.generate_lesson(module, tone="friendly", llm=llm)
    print(f"Lesson Generated: {len(lesson.content_md)} chars")
    
    print("\n--- Testing Slides Generation ---")
    slides = content.generate_slides("Python Variables", lesson.content_md, "Beginner", 10, llm)
    print(f"Slides Generated: {len(slides)} slides")
    
    print("\n--- Testing Quiz Generation ---")
    quizzes = content.generate_quiz(["Understand variables"], 2, llm)
    print(f"Quizzes Generated: {len(quizzes)} items")
    
    print("\n--- Testing Reading List Generation ---")
    # This uses DDGS causing network requests
    try:
        reading_list = content.generate_reading_list("Python Variables", ["Understand variables"], lesson.outline, "Beginner", llm)
        print(f"Reading List Generated: {len(reading_list)} items")
    except Exception as e:
        print(f"Reading List Generation Failed: {e}")

if __name__ == "__main__":
    test_content_generation()
