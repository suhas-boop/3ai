import asyncio
from autonomous_academy.llm import LLMClient
from autonomous_academy.services.content import generate_slides
from autonomous_academy.schemas import Slide
from pydantic import ValidationError
import json

def test():
    llm = LLMClient()
    topic = "Introduction to Database Systems"
    content_md = "Databases are essential. We use SQL."
    audience = "Beginner"
    duration = 60
    
    # Try generating and see what exceptions occur
    try:
        res = generate_slides(topic, content_md, audience, duration, llm)
        print("Generated", len(res), "slides.")
    except Exception as e:
        print("EXCEPTION:", e)

if __name__ == "__main__":
    test()
