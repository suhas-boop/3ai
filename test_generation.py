import asyncio
from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import Module
from autonomous_academy.services.content import generate_module_content

async def main():
    llm = LLMClient()
    module = Module(
        id="test-mod",
        title="Intro to React",
        objectives=["Learn components", "Learn state"],
        duration_minutes=30
    )
    
    lesson = generate_module_content(
        module=module,
        course_topic="React",
        audience="Beginner",
        tone="supportive",
        llm=llm
    )
    
    print("Slides:", len(lesson.slides))
    print("Reading List:", len(lesson.reading_list))
    print("Quizzes:", len(lesson.quizzes))

if __name__ == "__main__":
    asyncio.run(main())
