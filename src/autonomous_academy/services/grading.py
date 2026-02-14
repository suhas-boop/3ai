from __future__ import annotations

from typing import List

from autonomous_academy import prompts
from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import GradeCriterionResult, GradeResult, Item, Rubric


def grade_structured(item: Item, submission: str) -> GradeResult:
    """Grade MCQ/short answer with key comparison."""
    is_correct = submission.strip().lower() == (item.answer or "").strip().lower()
    score = 1.0 if is_correct else 0.0
    feedback = "Correct." if is_correct else "Check the rationale and review the lesson."
    return GradeResult(item_id=item.id, score=score, feedback=feedback, per_criterion=[])


def grade_freeform(item: Item, submission: str, llm: LLMClient) -> GradeResult:
    rubric: Rubric | None = item.rubric
    prompt = prompts.GRADING_PROMPT.format(
        rubric=rubric.model_dump() if rubric else {},
        reference_answer=rubric.reference_answer if rubric else "N/A",
        student_answer=submission,
    )
    prompt += "\n\nRespond with a valid JSON object with keys: per_criterion (list), feedback (string), confidence (float), needs_review (bool). per_criterion items should have: criterion, score, weight, feedback."
    
    response_text = llm.complete(prompt)
    
    try:
        data = llm.parse_json(response_text)
        per_criterion = []
        for c in data.get("per_criterion", []):
            per_criterion.append(GradeCriterionResult(
                criterion=c.get("criterion", "Criterion"),
                score=c.get("score", 0.0),
                weight=c.get("weight", 1.0),
                feedback=c.get("feedback", "No feedback")
            ))
            
        total_weight = sum(c.weight for c in per_criterion) or 1.0
        weighted_score = sum((c.score or 0) * c.weight for c in per_criterion) / total_weight
        
        return GradeResult(
            item_id=item.id,
            score=weighted_score,
            per_criterion=per_criterion,
            feedback=data.get("feedback", "Graded by AI"),
            confidence=data.get("confidence", 0.8),
            needs_review=data.get("needs_review", False),
        )
    except Exception as e:
        print(f"Error parsing grading result: {e}")

    # Fallback to stub
    per_criterion = [
        GradeCriterionResult(
            criterion=crit.criterion,
            score=0.7,
            weight=crit.weight,
            feedback="Placeholder feedback.",
        )
        for crit in (rubric.criteria if rubric else [])
    ]
    total_weight = sum(c.weight for c in per_criterion) or 1.0
    weighted_score = sum((c.score or 0) * c.weight for c in per_criterion) / total_weight
    return GradeResult(
        item_id=item.id,
        score=weighted_score,
        per_criterion=per_criterion,
        feedback="LLM-graded placeholder (Fallback).",
        confidence=0.5,
        needs_review=True,
    )
