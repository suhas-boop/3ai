from __future__ import annotations

from typing import Dict, List

from autonomous_academy.schemas import GradeResult, MasteryEstimate


def estimate_mastery(grades: List[GradeResult]) -> List[MasteryEstimate]:
    estimates: List[MasteryEstimate] = []
    for grade in grades:
        estimates.append(
            MasteryEstimate(
                learner_id="learner-1",
                objective_id=grade.item_id,
                estimate=grade.score,
                confidence=grade.confidence or 0.5,
                history=[f"Scored {grade.score} on {grade.item_id}"],
            )
        )
    return estimates


def summarize_performance(grades: List[GradeResult]) -> Dict[str, float]:
    if not grades:
        return {"avg_score": 0.0}
    avg = sum(g.score for g in grades) / len(grades)
    needs_review = sum(1 for g in grades if g.needs_review)
    return {"avg_score": avg, "needs_review_ratio": needs_review / len(grades)}
