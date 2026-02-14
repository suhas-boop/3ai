from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class SourceRef(BaseModel):
    id: str
    title: Optional[str] = None
    url: Optional[str] = None


class Charter(BaseModel):
    id: str
    audience: str
    outcomes: List[str]
    prerequisites: List[str] = Field(default_factory=list)
    time_budget_hours: Optional[int] = None
    tone: Optional[str] = None
    constraints: List[str] = Field(default_factory=list)
    sources: List[SourceRef] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)


class Module(BaseModel):
    id: str
    title: str
    objectives: List[str]
    duration_minutes: Optional[int] = None
    dependencies: List[str] = Field(default_factory=list)
    checkpoints: List[str] = Field(default_factory=list)
    references: List[SourceRef] = Field(default_factory=list)


class Slide(BaseModel):
    title: str
    bullets: List[str]
    speaker_notes: Optional[str] = None
    image_description: Optional[str] = None


class RubricCriterion(BaseModel):
    criterion: str
    weight: float = 1.0
    levels: List[str] = Field(default_factory=list)


class Rubric(BaseModel):
    criteria: List[RubricCriterion]
    reference_answer: Optional[str] = None


class Item(BaseModel):
    id: str
    module_id: str
    type: str  # mcq, sa, project, code
    stem: str
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    rationale: Optional[str] = None
    difficulty: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    rubric: Optional[Rubric] = None
    references: List[SourceRef] = Field(default_factory=list)
    tests_path: Optional[str] = None  # for coding tasks


class ProjectBrief(BaseModel):
    title: str
    scenario: str
    deliverables: List[str]
    rubric: Optional[Rubric] = None


class Lesson(BaseModel):
    id: str
    module_id: str
    outline: List[str]
    content_md: str
    reading_list: List[SourceRef] = Field(default_factory=list)
    slides: List[Slide] = Field(default_factory=list)
    quizzes: List[Item] = Field(default_factory=list)
    project: Optional[ProjectBrief] = None
    citations: List[SourceRef] = Field(default_factory=list)
    accessibility_notes: List[str] = Field(default_factory=list)


class GradeCriterionResult(BaseModel):
    criterion: str
    score: float
    weight: float = 1.0
    feedback: Optional[str] = None


class GradeResult(BaseModel):
    item_id: str
    score: float
    per_criterion: List[GradeCriterionResult] = Field(default_factory=list)
    feedback: Optional[str] = None
    confidence: Optional[float] = None
    needs_review: bool = False


class VideoAsset(BaseModel):
    lesson_id: str
    script: str
    captions_vtt: Optional[str] = None
    slides_outline: List[str] = Field(default_factory=list)
    mp4_path: Optional[str] = None
    duration_seconds: Optional[int] = None


class MasteryEstimate(BaseModel):
    learner_id: str
    objective_id: str
    estimate: float
    confidence: Optional[float] = None
    history: List[str] = Field(default_factory=list)
