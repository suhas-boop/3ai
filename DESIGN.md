# AI-Generated Course Pipeline

Design for a fully AI-orchestrated course: syllabus, lessons, assignments, grading, walkthrough videos, personalization, and QA.

## 0. Principles
- Grounded: all content and answers cite provided sources; RAG + citations; low-confidence routes to human.
- Safety/quality gates at each stage (fact-check, toxicity/bias, accessibility, plagiarism).
- Human-in-loop checkpoints: syllabus approval, sample lessons, assessment audit, grading audit.
- Observability: logs, metrics for generation quality, grading confidence, and learner performance.

## 1. Inputs
- Audience, outcomes, prerequisites, time budget, tone, constraints (citation required, banned topics).
- Source corpus for grounding (docs/papers/videos) + metadata.
- Delivery constraints (LMS/LTI, formats for slides/video, language locale).

## 2. Workflow
1) Charter: AI drafts course charter (scope, objectives, voice) from inputs → human approval.
2) Syllabus: AI proposes modules with objectives, time estimates, dependencies, checkpoints → approval.
3) Lessons: for each module, generate outline → lesson markdown → slide outline → fact-check + accessibility lint.
4) Assignments: generate item bank (MCQ/short answer), projects/rubrics, coding tasks with tests → ambiguity check.
5) Grading: structured via keys/tests; freeform via rubric + reference answer + LLM grader with confidence + escalation.
6) Walkthrough videos: script from outline → TTS → slide render → stitch → captions/transcript.
7) Personalization: pre-assessment → mastery vector → recommend next module/practice.
8) Tutor: RAG QA bot over course corpus with refusal when ungrounded.
9) QA gates: grounding check, safety filters, plagiarism/similarity, accessibility; human samples.
10) Analytics loop: track completion, item difficulty, confusion hotspots → regenerate/adjust items and pacing.

## 3. Services (Python-first)
- content-service: charter/syllabus/lessons/slides generation; uses RAG over corpus.
- assessment-service: item bank creation, rubric builder, coding starter + unit tests.
- grading-service: auto-grading (tests/keys), LLM rubric grader with confidence + audit hooks.
- video-service: script generator → TTS → slide render (e.g., Marp/Reveal) → ffmpeg stitch.
- tutor-service: RAG QA bot with safety/refusal and linkbacks to lessons.
- analytics-service: mastery estimation, item stats, feedback into regeneration.

## 4. Data Schemas (JSON, draft)
- Charter: id, audience, outcomes[], prerequisites[], tone, constraints[], sources[].
- Module: id, title, objectives[], duration_min, deps[], references[].
- Lesson: id, module_id, outline[], content_md, slides_outline[], citations[], accessibility_notes.
- Item (bank): id, module_id, type (mcq/sa/project/code), stem, options?, answer, rationale, difficulty, tags[], rubric, references[], tests? (for code).
- Rubric score: criterion, weight, levels[], reference_answer.
- Grade result: item_id, score, per_criterion[], feedback, confidence, needs_review.
- Video asset: lesson_id, script, captions, slides, mp4_path, duration.
- Mastery: learner_id, objective_id, estimate, confidence, history.

## 5. Prompt Templates (high level)
- Charter: “Given audience/outcomes/prereqs/time/tone/sources, propose charter + constraints; cite sources; list open questions.”
- Syllabus: “Propose N modules with objectives, time, deps, checkpoints; objectives must be observable verbs; cite sources.”
- Lesson: “Generate outline → expand to markdown with examples; mark citations [source_id]; add accessibility notes.”
- Assessment: “For each objective, create items (type, difficulty, answer/rationale, citation); flag ambiguity; provide rubric.”
- Coding: “Produce starter code + unit tests; tests must fail on empty impl and pass on reference.”
- Grading: “Given rubric, reference answer, student answer, return JSON per criterion with evidence quotes and confidence; refuse if ungrounded.”
- Video: “Create narration script with timestamps, on-screen text, slide cues; keep to target duration; provide captions.”
- Tutor: “Answer only from provided chunks; cite; if unknown, say so and point to related lessons.”

## 6. Safety & Quality
- Grounding: enforce citations; retrieval + post-check that citations exist; refuse when unsupported.
- Fact-check: secondary LLM pass to challenge claims against sources.
- Toxicity/bias filter on generated text and tutor outputs.
- Accessibility: alt text, captions, color-contrast lint, transcript required.
- Plagiarism/similarity for student submissions; originality prompts on projects.
- Escalation rules: low-confidence grading, ungrounded answers, or missing citations → human review.

## 7. Analytics & Iteration
- Capture: completion, time-on-task, item difficulty/discrimination, replays of walkthroughs, confusion triggers (e.g., repeated hints).
- Use analytics to trigger regeneration: weak objectives → generate reinforcement items; hard items → add hints; fast finishes → enrichment.

## 8. Delivery/Integrations
- Content formats: markdown for lessons; JSON for schemas; slides via Marp/Reveal; videos MP4 + VTT.
- LMS/LTI: sync enrollments and grades; webhooks for submission events; SSO/roles for instructor overrides.

## 9. Implementation Plan (Python)
- Set up mono repo structure: services/, shared/ (schemas, prompts, clients), data/.
- Build schemas (pydantic) and IO contracts; add sample fixtures.
- Implement content/assessment generators with stub LLM client + local corpus loader.
- Implement grading: test harness for coding, rubric-based LLM grader with confidence and audit logs.
- Implement video stub: script generator + placeholders for TTS/render; mock artifacts for now.
- Add tutor RAG stub: ingest sample corpus; retrieval + grounded answer with refusal.
- Add safety/QA utilities: citation checker, profanity/bias stub, accessibility lint.
- Wire simple CLI/API to run end-to-end for one module; capture logs/metrics; iterate.
