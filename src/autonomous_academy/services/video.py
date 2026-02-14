from __future__ import annotations

from typing import List

from autonomous_academy import prompts
from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import Lesson, VideoAsset


def generate_walkthrough(lesson: Lesson, target_duration_seconds: int, llm: LLMClient) -> VideoAsset:
    prompt = prompts.VIDEO_PROMPT.format(outline=lesson.outline, duration=target_duration_seconds)
    response = llm.complete(prompt)
    script_lines: List[str] = [
        "00:00 Intro to the lesson.",
        "00:15 Key concept overview.",
        "00:45 Worked example narration.",
        "01:15 Common pitfalls callouts.",
        "01:45 Recap and next steps.",
    ]
    captions = "\n".join(script_lines)
    return VideoAsset(
        lesson_id=lesson.id,
        script="\n".join(script_lines),
        captions_vtt=captions,
        slides_outline=lesson.slides_outline,
        mp4_path=None,
        duration_seconds=target_duration_seconds,
    )
