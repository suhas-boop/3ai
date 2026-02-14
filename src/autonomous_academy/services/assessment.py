from __future__ import annotations

from typing import List

from autonomous_academy import prompts
from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import Item, Module, Rubric, RubricCriterion, SourceRef


def generate_items(module: Module, llm: LLMClient, count: int = 4) -> List[Item]:
    prompt = prompts.ASSESSMENT_PROMPT.format(
        objectives=module.objectives,
        count=count,
        references=[r.model_dump() for r in module.references],
    )
    prompt += "\n\nRespond with a valid JSON list of objects, where each object matches the Item schema (type, stem, options, answer, rationale, difficulty, tags)."
    
    response_text = llm.complete(prompt)
    
    try:
        data = llm.parse_json(response_text)
        items = []
        if isinstance(data, list):
            for i, item_data in enumerate(data):
                items.append(Item(
                    id=f"{module.id}-item-{i+1}",
                    module_id=module.id,
                    type=item_data.get("type", "mcq"),
                    stem=item_data.get("stem", f"Question {i+1}"),
                    options=item_data.get("options", ["A", "B"] if item_data.get("type") == "mcq" else None),
                    answer=item_data.get("answer", "Answer"),
                    rationale=item_data.get("rationale", "Rationale"),
                    difficulty=item_data.get("difficulty", "medium"),
                    tags=item_data.get("tags", [module.title.lower()]),
                    references=module.references[:1]
                ))
            return items
    except Exception as e:
        print(f"Error parsing items: {e}")

    # Fallback to stub
    items: List[Item] = []
    for idx in range(count):
        items.append(
            Item(
                id=f"{module.id}-item-{idx+1}",
                module_id=module.id,
                type="mcq" if idx % 2 == 0 else "sa",
                stem=f"Placeholder question {idx+1} for {module.title}",
                options=["A", "B", "C", "D"] if idx % 2 == 0 else None,
                answer="A" if idx % 2 == 0 else "Short answer placeholder",
                rationale="Placeholder rationale",
                difficulty="medium",
                tags=[module.title.lower()],
                references=module.references[:1],
            )
        )
    return items


def generate_project(module: Module, llm: LLMClient) -> Item:
    prompt = prompts.PROJECT_PROMPT.format(
        objectives=module.objectives, duration="2 weeks", references=[r.model_dump() for r in module.references]
    )
    prompt += "\n\nRespond with a valid JSON object with keys: brief, deliverables, rubric (with criteria list), and exemplar. Criteria should have keys: criterion, weight, levels."
    
    response_text = llm.complete(prompt)
    
    try:
        data = llm.parse_json(response_text)
        rubric_data = data.get("rubric", {})
        criteria = []
        for c in rubric_data.get("criteria", []):
            criteria.append(RubricCriterion(
                criterion=c.get("criterion", "Criterion"),
                weight=c.get("weight", 1.0),
                levels=c.get("levels", ["poor", "good"])
            ))
            
        rubric = Rubric(
            criteria=criteria,
            reference_answer=data.get("exemplar", "Reference approach")
        )
        
        return Item(
            id=f"{module.id}-project",
            module_id=module.id,
            type="project",
            stem=data.get("brief", f"Capstone project for {module.title}"),
            answer=None,
            rationale=data.get("deliverables", "Deliverables description"), 
            difficulty="hard",
            tags=["project"],
            rubric=rubric,
            references=module.references,
        )
    except Exception as e:
        print(f"Error parsing project: {e}")

    # Fallback to stub
    rubric = Rubric(
        criteria=[
            RubricCriterion(criterion="Correctness", weight=0.5, levels=["poor", "ok", "good"]),
            RubricCriterion(criterion="Clarity", weight=0.3, levels=["poor", "ok", "good"]),
            RubricCriterion(criterion="Citations", weight=0.2, levels=["missing", "partial", "complete"]),
        ],
        reference_answer="Reference approach placeholder",
    )
    return Item(
        id=f"{module.id}-project",
        module_id=module.id,
        type="project",
        stem=f"Capstone project for {module.title}",
        answer=None,
        rationale=None,
        difficulty="hard",
        tags=["project"],
        rubric=rubric,
        references=module.references,
    )
