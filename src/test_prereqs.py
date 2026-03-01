import asyncio
from autonomous_academy.services.content import generate_prerequisites
from autonomous_academy.llm import LLMClient

async def main():
    llm = LLMClient()
    res = generate_prerequisites("Machine Learning", "Beginner", llm)
    print("Prerequisites:", res)

asyncio.run(main())
