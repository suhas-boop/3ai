
import asyncio
from autonomous_academy.services.content import generate_slides
from autonomous_academy.llm import LLMClient

# Mock LLM Client wrapper if needed, or use the real one
# Assuming LLMClient is initialized with env vars which should be present in the user's environment
# but I need to check how it's initialized.

async def run_debug():
    print("Initializing LLM...")
    try:
        llm = LLMClient() 
    except Exception as e:
        print(f"Failed to init LLM: {e}")
        return

    topic = "Python Decorators"
    content_md = """
# Python Decorators
## Introduction
Decorators are a powerful way to modify behavior of functions.
## Core Concepts
### Higher Order Functions
Functions that take other functions as args.
### Wrapper Functions
Inner functions that wrap logic.
### Syntax Sugar
Using @ symbol.
## Summary
Decorators allow clean, reusable code.
"""
    audience = "Intermediate"
    duration = 30

    print("Generating slides...")
    try:
        slides = generate_slides(topic, content_md, audience, duration, llm)
        print("\n--- Generated Slides ---")
        for s in slides:
            print(f"Title: {s.title}")
            print(f"Bullets: {len(s.bullets)}")
            print(f"Notes: {len(s.speaker_notes or '')} chars")
            print(f"Image: {s.image_description}")
            print("-" * 20)
    except Exception as e:
        print(f"CRASHED: {e}")

if __name__ == "__main__":
    asyncio.run(run_debug())
