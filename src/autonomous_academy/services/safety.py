from __future__ import annotations

from typing import List, Tuple


def check_citations(text: str, required_ids: List[str]) -> Tuple[bool, List[str]]:
    """Check citation markers exist."""
    missing = [cid for cid in required_ids if cid not in text]
    return (len(missing) == 0, missing)


def check_toxicity(text: str) -> bool:
    """Placeholder toxicity flag. Replace with real model."""
    banned_terms = []
    return not any(term in text.lower() for term in banned_terms)


def check_accessibility(slides_outline: List[str]) -> bool:
    return all(bool(s.strip()) for s in slides_outline)
