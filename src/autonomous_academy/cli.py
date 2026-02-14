from __future__ import annotations

import json
from pathlib import Path
from typing import List

import typer
from rich import print

from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import SourceRef
from autonomous_academy.services import analytics, assessment, content, grading, tutor, video

app = typer.Typer(help="AI course pipeline demo (stubbed).")


def load_sample_sources() -> List[SourceRef]:
    return [
        SourceRef(id="doc-1", title="AI overview", url="sample_corpus.md"),
        SourceRef(id="doc-2", title="Assessments", url="sample_corpus.md"),
        SourceRef(id="doc-3", title="Accessibility", url="sample_corpus.md"),
    ]


@app.command()
def demo(audience: str = "Beginners", tone: str = "supportive") -> None:
    llm = LLMClient()
    sources = load_sample_sources()

    charter = content.generate_charter(
        audience=audience,
        outcomes=["Understand pipeline", "Run AI-assisted course"],
        prerequisites=["Basic AI awareness"],
        time_budget_hours=10,
        tone=tone,
        constraints=["Citations required", "Keep content concise"],
        sources=sources,
        llm=llm,
    )
    modules = content.generate_syllabus(charter, sources, llm)
    lesson = content.generate_lesson(modules[0], tone=tone, llm=llm)
    items = assessment.generate_items(modules[0], llm=llm)
    project = assessment.generate_project(modules[0], llm=llm)
    grades = [
        grading.grade_structured(items[0], submission="A"),
        grading.grade_freeform(project, submission="Project draft text", llm=llm),
    ]
    walkthrough = video.generate_walkthrough(lesson, target_duration_seconds=120, llm=llm)
    tutor_answer = tutor.answer_question("What is the key objective?", [lesson.content_md], llm=llm)
    mastery = analytics.estimate_mastery(grades)

    result = {
        "charter": charter.model_dump(),
        "modules": [m.model_dump() for m in modules],
        "lesson": lesson.model_dump(),
        "items": [i.model_dump() for i in items],
        "project": project.model_dump(),
        "grades": [g.model_dump() for g in grades],
        "walkthrough": walkthrough.model_dump(),
        "tutor_answer": tutor_answer,
        "mastery": [m.model_dump() for m in mastery],
    }
    print_json(result)


def print_json(payload: dict) -> None:
    print("[bold green]Demo output[/bold green]")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    app()
