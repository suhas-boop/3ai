"""Prompt templates used across services."""

CHARTER_PROMPT = """You are drafting a course charter.
- Audience: {audience}
- Outcomes: {outcomes}
- Prerequisites: {prereqs}
- Time budget (hours): {time_budget}
- Tone: {tone}
- Constraints: {constraints}
- Sources: {sources}

Tasks:
1) Propose scope, objectives, and voice.
2) List constraints to enforce (citation required, safety).
3) List open questions for the instructor.
Return JSON with charter + open_questions."""

SYLLABUS_PROMPT = """Create a detailed course syllabus properly paced for the duration.
- Charter: {charter}
- References: {sources}
- Module Count: {count}

Tasks:
1) Generate a list of EXACTLY {count} modules.
2) Ensure the flow is logical: Foundations -> Core Concepts -> Advanced Applications -> Capstone.
3) Each module must have a duration of 60 minutes.
4) Topic progression must fit the total complexity of the course (5 vs 24 vs 48 modules).

Return a SINGLE JSON LIST of Module objects.
Note: 'checkpoints' should be a list of strings (descriptions only).
Example: [{{ "id": "mod-1", "checkpoints": ["Quiz 1", "Lab 1"], ... }}, {{ "id": "mod-2", ... }}]"""

LESSON_PROMPT = """Create a structured lesson plan.
- Module objectives: {objectives}
- Duration (minutes): {duration}
- References: {references}
- Tone: {tone}

Tasks:
1) Outline: Create a 5-9 bullet point outline.
2) Content: Write a detailed Markdown lesson. **YOU MUST USE THE FOLLOWING STRUCTURE**:
   - **# Title**
   - **## Introduction**: Hook the learner and explain relevance.
   - **## Learning Objectives**: Briefly state what will be learned.
   - **## Core Concepts**: Deep dive into the material (use subheaders like ### Concept 1).
   - **## Practical Application**: A worked example, case study, or code snippet.
   - **## Summary**: content recap.
   - Ensure content depth fits the {duration} minute timeframe.
3) Slide outline (title + bullets).
4) Accessibility notes (alt text, caption reminders).
Return JSON with outline, content_md, slides_outline, citations, accessibility_notes.
**IMPORTANT**: For 'content_md', ensure all newlines are escaped as '\\n'. Do not use raw newlines inside the JSON value.
"""

ASSESSMENT_PROMPT = """Create assessment items (quizzes).
- Objectives: {objectives}
- Item count: {count}
- References: {references}

Tasks:
1) Create {count} assessment items to test the objectives.
2) **BRIDGE QUESTION**: Make the last question hint at or bridge to the next logical topic in the sequence.
3) For multiple choice (mcq), provide 4 options and the correct answer.
4) For short answer (sa), provide a reference answer.

Return JSON list of Item objects:
- id (string, e.g., "q1")
- type ("mcq" or "sa")
- stem (the question text)
- options (list of strings, for mcq only)
- answer (correct answer string)
- rationale (explanation)
- difficulty ("easy", "medium", "hard")
"""

PROJECT_PROMPT = """Create a HANDS-ON CAPSTONE PROJECT BRIEF.
- Objectives: {objectives}
- Duration (minutes): {duration}
- References: {references}

Tasks:
1) Design a practical scenario that contributes to a **Course-Long Capstone Project**.
2) The student should be building a part of a larger system or portfolio piece.
3) Define clear deliverables for *this specific module's contribution*.
4) Create a grading rubric.

Return JSON object (ProjectBrief):
- title (string)
- scenario (string, detailed description linking to the larger picture)
- deliverables (list of strings)
- rubric (object):
    - criteria (list of objects: {{criterion, weight, levels}})
    - reference_answer (optional string describing ideal submission)
"""

GRADING_PROMPT = """Grade using rubric.
Input:
- Rubric: {rubric}
- Reference answer: {reference_answer}
- Student answer: {student_answer}

Tasks:
1) Score each criterion with evidence quotes.
2) Provide overall score 0-1.
3) Provide short feedback.
4) Provide confidence 0-1; if low confidence, set needs_review true.
Return JSON with per_criterion, score, feedback, confidence, needs_review."""

VIDEO_PROMPT = """Create a walkthrough script.
- Lesson outline: {outline}
- Target duration (seconds): {duration}

Tasks:
1) Narration script with timestamps and on-screen text cues.
2) Slide cues aligned to narration.
3) Captions text (plain).
Return JSON with script, slides_outline, captions."""

READING_LIST_PROMPT = """Curate a highly relevant reading list for this lesson.
- Topic: {topic}
- Audience: {audience}
- Learning Objectives: {objectives}
- Lesson Outline: {outline}
- Language: English Only

Tasks:
1) Select 3-5 **REAL, VERIFIABLE** resources that directly support the lesson outline.
2) Prioritize:
   - **Official Documentation** (e.g., Python docs, MDN, AWS docs)
   - **PDF Manuals / Cheatsheets**
   - **Wikipedia** (for broad concepts)
   - **Reputable Tutorials** (Medium, Dev.to, RealPython)
3) **CRITICAL: URL RULES**:
   - **ABSOLUTELY NO** generic "google.com/search" links. These are lazy and not helpful.
   - You **MUST** prioritize the specific URLs provided in the Context above.
   - If the context links are good, USE THEM.
   - If you must guess a URL, ensure it is a high-confidence official domain (e.g. docs.python.org).
   - If you cannot find a specific link, omit the resource rather than providing a search link.

Return JSON list of SourceRef objects (id, title, url)."""

SLIDES_PROMPT = """Create a detailed slide deck.
- Topic: {topic}
- Content: {content_md}
- Audience: {audience}
- Duration (minutes): {duration}

Tasks:
1) Create EXACTLY {slide_count} slides to ensure the lecture fits the {duration}-minute duration.
2) **slide 1**: Title Slide.
3) **slide 2**: Learning Objectives.
4) **Middle Slides**: Core Concepts.
   - For TECHNICAL/CODING topics: You MUST alternate between **Concept Slides** and **Code Example Slides**.
   - Include at least one **"Hands-on Exercise"** slide where students are asked to write code.
5) **Last slide**: Summary/Recap.
6) For each slide, provide:
   - **Title**: Clear and catchy.
   - **Bullets**: 4-6 detailed points.
   - **Speaker Notes**: A FULL paragraph of script for the presenter (100+ words).
   - **Image Description**: A visually descriptive search query.

Return JSON list of Slide objects (title, bullets, speaker_notes, image_description).
**IMPORTANT**: Respond with RAW JSON ONLY. Do not include <think> tags or reasoning. Do not wrap in markdown blocks."""

CODING_CHALLENGE_PROMPT = """Create a coding challenge for this module.
- Objectives: {objectives}
- Topic: {topic}
- Audience: {audience}

Tasks:
1) Design a small, self-contained coding problem that tests the core concept.
2) Provide a clear problem statement (stem).
3) Provide a starter code snippet (optional).
4) Provide the solution code.
5) explain the solution (rationale).

Return JSON list of Item objects (just 1 item):
- id (string, "code-1")
- type ("code")
- stem (Markdown problem description)
- options (list containing [Starter Code, Solution Code]) -> Reuse 'options' field: Index 0 is Starter, Index 1 is Solution.
- answer (Expected output or test case)
- rationale (Explanation of solution)
- difficulty ("medium")
"""

TUTOR_PROMPT = """You are a grounded tutor. Use only provided sources.
- Question: {question}
- Chunks: {chunks}

If unknown, say you cannot find it and point to the nearest lesson section."""
