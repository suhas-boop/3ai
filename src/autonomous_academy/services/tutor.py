from __future__ import annotations

from typing import List

from autonomous_academy import prompts
from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import SourceRef


def answer_question(question: str, chunks: List[str], llm: LLMClient) -> str:
    prompt = prompts.TUTOR_PROMPT.format(question=question, chunks=chunks)
    response = llm.complete(prompt)
    # Placeholder grounded answer.
    if not chunks:
        return "I cannot find this in the course sources. Please review the relevant lesson."
    return f"Based on the course materials: {chunks[0][:160]}..."
