from __future__ import annotations

import json
from typing import List

from autonomous_academy import prompts
from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import Charter, Lesson, Module, SourceRef, Slide, Item, ProjectBrief

# ... imports ...


from duckduckgo_search import DDGS

def generate_reading_list(topic: str, objectives: List[str], outline: List[str], audience: str, llm: LLMClient) -> List[SourceRef]:
    # 1. search for real sources with multiple queries
    search_results = []
    queries = [
        f"{topic} documentation best practices {audience}",
        f"{topic} tutorial pdf filetype:pdf",
        f"{topic} guide site:medium.com OR site:dev.to"
    ]
    
    try:
        with DDGS() as ddgs:
            for q in queries:
                try:
                    results = list(ddgs.text(q, max_results=3))
                    for r in results:
                        # Simple filtering to avoid garbage
                        if "google.com/search" not in r['href'] and "promoted" not in r.get('body', '').lower():
                             search_results.append({"title": r['title'], "url": r['href'], "snippet": r['body']})
                except Exception as inner_e:
                    print(f"Search query '{q}' failed: {inner_e}")
    except Exception as e:
        print(f"Search session failed: {e}")
    
    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for r in search_results:
        if r['url'] not in seen_urls:
            unique_results.append(r)
            seen_urls.add(r['url'])
    
    # 2. Ask LLM to curate
    prompt = prompts.READING_LIST_PROMPT.format(
        topic=topic,
        audience=audience,
        objectives=objectives,
        outline=outline
    )
    # Inject search results context
    prompt += f"\n\nContext from Web Search (Prioritize these REAL links):\n{json.dumps(unique_results[:8], indent=2)}"
    prompt += "\n\nRespond with a valid JSON list of SourceRef objects."
    
    response_text = llm.complete(prompt)
    try:
        data = llm.parse_json(response_text)
        if isinstance(data, list):
            # Ensure ID is string
            cleaned_data = []
            for item in data:
                if 'id' in item:
                    item['id'] = str(item['id'])
                cleaned_data.append(item)
            return [SourceRef(**item) for item in cleaned_data]
    except Exception as e:
        print(f"Error parsing reading list: {e}")
    
    # Fallback: Return raw search results as sources if LLM parsing fails
    if unique_results:
         return [SourceRef(id=f"search-{i}", title=r['title'], url=r['url']) for i, r in enumerate(unique_results[:3])]

    return [SourceRef(id="ref-1", title=f"Search: {topic}", url=f"https://www.google.com/search?q={topic.replace(' ', '+')}")]


def generate_slides(topic: str, content_md: str, audience: str, duration_minutes: int, llm: LLMClient) -> List[Slide]:
    # Calculate target slide count: ~3 mins per slide or at least 5
    target_count = max(5, duration_minutes // 3)
    
    prompt = prompts.SLIDES_PROMPT.format(
        topic=topic,
        content_md=content_md[:4000], 
        audience=audience,
        duration=duration_minutes,
        slide_count=target_count
    )
    prompt += "\n\nRespond with a valid JSON list of Slide objects."
    
    response_text = llm.complete(prompt)
    print(f"DEBUG SLIDES RAW RESPONSE: {response_text[:500]}...") # Log first 500 chars
    try:
        data = llm.parse_json(response_text)
        if isinstance(data, list):
            return [Slide(**item) for item in data]
    except Exception as e:
        print(f"Error parsing slides: {e}")
        print(f"DEBUG SLIDES FULL RESPONSE: {response_text}") # Log full response on error
        
    return [Slide(title=topic, bullets=["Key Point 1", "Key Point 2"], speaker_notes="Intro")]


def generate_lesson(module: Module, tone: str, llm: LLMClient) -> Lesson:
    prompt = prompts.LESSON_PROMPT.format(
        objectives=module.objectives, 
        references=[r.model_dump() for r in module.references], 
        tone=tone,
        duration=module.duration_minutes or 60
    )
    prompt += "\n\nRespond with a valid JSON object matching the Lesson schema (outline, content_md, slides_outline, accessibility_notes)."
    
    response_text = llm.complete(prompt)
    
    try:
        data = llm.parse_json(response_text)
        accessibility_notes = data.get("accessibility_notes", ["Ensure alt text"])
        if isinstance(accessibility_notes, str):
            accessibility_notes = [accessibility_notes]
        elif isinstance(accessibility_notes, dict):
            # Flatten values if it's a dict
            accessibility_notes = [str(v) for v in accessibility_notes.values()]

        return Lesson(
            id=f"{module.id}-lesson",
            module_id=module.id,
            outline=data.get("outline", ["Intro", "Body", "Conclusion"]),
            content_md=data.get("content_md", "## Content\nGenerated content placeholder."),
            reading_list=[], 
            slides=[],     
            citations=module.references[:2],
            accessibility_notes=accessibility_notes
        )
    except Exception as e:
        print(f"Error parsing lesson: {e}")

    # Fallback to stub
    outline = [
        "Why this matters",
        "Key concepts",
        "Worked example",
        "Common pitfalls",
        "Summary",
    ]
    content_md = "\n".join(f"## {point}\nPlaceholder content {tone}." for point in outline)
    return Lesson(
        id=f"{module.id}-lesson",
        module_id=module.id,
        outline=outline,
        content_md=content_md,
        reading_list=[],
        slides=[],
        citations=module.references,
        accessibility_notes=[
            "Ensure alt text for diagrams",
            "Provide transcript for video segments",
        ],
    )

def generate_quiz(objectives: List[str], count: int, llm: LLMClient) -> List[Item]:
    prompt = prompts.ASSESSMENT_PROMPT.format(
        objectives=objectives,
        count=count,
        references="Standard course material"
    )
    prompt += "\n\nRespond with a valid JSON list of Item objects."
    
    response_text = llm.complete(prompt)
    try:
        data = llm.parse_json(response_text)
        if isinstance(data, list):
            items = []
            for item in data:
                item['module_id'] = 'temp' # Placeholder, will be overwritten
                items.append(Item(**item))
            return items
    except Exception as e:
        print(f"Error parsing quiz: {e}")
        
    # Fallback stub
    return [
        Item(id="q1", type="mcq", stem="Placeholder Question", options=["A", "B"], answer="A", rationale="Rationale"),
    ]


def generate_coding_challenge(objectives: List[str], topic: str, audience: str, llm: LLMClient) -> Item | None:
    prompt = prompts.CODING_CHALLENGE_PROMPT.format(
        objectives=objectives,
        topic=topic,
        audience=audience
    )
    prompt += "\n\nRespond with a valid JSON list."
    
    response_text = llm.complete(prompt)
    print(f"DEBUG CHALLENGE RAW: {response_text[:500]}...")
    try:
        data = llm.parse_json(response_text)
        if isinstance(data, list) and len(data) > 0:
            item_data = data[0]
            # Ensure coding type
            item_data['type'] = 'code'
            item_data['id'] = item_data.get('id', 'code-1')
            item_data['stem'] = item_data.get('stem', 'Coding Problem')
            # Ensure answer is a string
            if 'answer' in item_data and not isinstance(item_data['answer'], str):
                item_data['answer'] = str(item_data['answer'])
                
            item_data['module_id'] = "temp-mod-id" # Placeholder
            return Item(**item_data)
    except Exception as e:
        print(f"Error parsing coding challenge: {e}")
        print(f"DEBUG CHALLENGE FULL: {response_text}")
    return None
    
def generate_project(objectives: List[str], duration: int, llm: LLMClient) -> ProjectBrief | None:
    prompt = prompts.PROJECT_PROMPT.format(
        objectives=objectives,
        duration=duration,
        references="Standard course material"
    )
    prompt += "\n\nRespond with a valid JSON object matching the ProjectBrief schema."
    
    response_text = llm.complete(prompt)
    print(f"DEBUG PROJECT RAW: {response_text[:500]}...")
    try:
        data = llm.parse_json(response_text)
        return ProjectBrief(**data)
    except Exception as e:
        print(f"Error parsing project: {e}")
        print(f"DEBUG PROJECT FULL: {response_text}")
    return None

def generate_module_content(module: Module, course_topic: str, audience: str, tone: str, llm: LLMClient) -> Lesson:
    # 1. Draft: Lecture Notes (First, to get consistency)
    # generate_lesson already has internal fallback
    base_lesson = generate_lesson(module, tone, llm)
    
    # 2. Research: Reading List (Tailored to the specific lesson content)
    reading_list = []
    try:
        reading_list = generate_reading_list(
            topic=module.title, 
            objectives=module.objectives, 
            outline=base_lesson.outline, 
            audience=audience, 
            llm=llm
        )
    except Exception as e:
        print(f"Failed to generate reading list: {e}")
        # Fallback to simple search link
        reading_list = [SourceRef(id="ref-fallback", title=f"Search: {module.title}", url=f"https://www.google.com/search?q={module.title.replace(' ', '+')}")]
    
    # 3. Present: Slides (Based on content)
    slides = []
    try:
        slides = generate_slides(module.title, base_lesson.content_md, audience, module.duration_minutes or 60, llm)
    except Exception as e:
        print(f"Failed to generate slides: {e}")

    # 4. Assess: Quiz OR Coding Challenge
    quizzes = []
    try:
        # Detect CS/Programming topic
        cs_keywords = ["python", "java", "c++", "javascript", "script", "code", "programming", "sql", "data science", "react", "algorithm"]
        is_cs_topic = any(k in course_topic.lower() for k in cs_keywords)
        
        if is_cs_topic:
            # Generate 1 Coding Challenge + 2 Regular Questions
            try:
                challenge = generate_coding_challenge(module.objectives, course_topic, audience, llm)
                if challenge:
                    challenge.module_id = module.id
                    quizzes.append(challenge)
            except Exception as inner_e:
                print(f"Failed to generate coding challenge: {inner_e}")
            
            # Add 2 more standard questions
            standard_quizzes = generate_quiz(module.objectives, count=2, llm=llm)
            for q in standard_quizzes:
                q.module_id = module.id
                quizzes.append(q)
        else:
            # Generate 3 standard questions
            quizzes = generate_quiz(module.objectives, count=3, llm=llm)
            for q in quizzes:
                q.module_id = module.id
    except Exception as e:
         print(f"Failed to generate quizzes: {e}")

    # 5. Apply: Project (Assignments Agent)
    # Only if duration > 30 mins, otherwise simpler task
    project = None
    try:
        if (module.duration_minutes or 60) >= 30:
            project = generate_project(module.objectives, duration=module.duration_minutes or 60, llm=llm)
    except Exception as e:
        print(f"Failed to generate project: {e}")

    # Update the lesson object
    base_lesson.reading_list = reading_list
    base_lesson.slides = slides
    base_lesson.quizzes = quizzes
    base_lesson.project = project
    
    return base_lesson


def generate_charter(
    audience: str,
    outcomes: List[str],
    prerequisites: List[str],
    time_budget_hours: int | None,
    tone: str,
    constraints: List[str],
    sources: List[SourceRef],
    llm: LLMClient,
) -> Charter:
    prompt = prompts.CHARTER_PROMPT.format(
        audience=audience,
        outcomes=outcomes,
        prereqs=prerequisites,
        time_budget=time_budget_hours,
        tone=tone,
        constraints=constraints,
        sources=[s.model_dump() for s in sources],
    )
    prompt += "\n\nRespond with a valid JSON object matching the Charter schema structure."
    
    response_text = llm.complete(prompt)
    
    try:
        data = llm.parse_json(response_text)
        return Charter(
            id="charter-1",
            audience=data.get("audience", audience),
            outcomes=data.get("outcomes", outcomes),
            prerequisites=data.get("prerequisites", prerequisites),
            time_budget_hours=data.get("time_budget_hours", time_budget_hours),
            tone=data.get("tone", tone),
            constraints=data.get("constraints", constraints),
            sources=sources,
            open_questions=data.get("open_questions", ["Assess available compute resources"]),
        )
    except Exception as e:
        print(f"Error parsing charter: {e}")
        return Charter(
            id="charter-1",
            audience=audience,
            outcomes=outcomes,
            prerequisites=prerequisites,
            time_budget_hours=time_budget_hours,
            tone=tone,
            constraints=constraints,
            sources=sources,
            open_questions=["Confirm dataset access (fallback)"],
        )


def generate_syllabus(charter: Charter, sources: List[SourceRef], module_count: int, llm: LLMClient) -> List[Module]:
    modules: List[Module] = []
    
    # Chunk size for generation to avoid token limits
    CHUNK_SIZE = 12
    
    # Calculate number of chunks
    total_chunks = (module_count + CHUNK_SIZE - 1) // CHUNK_SIZE
    
    previous_context = ""
    
    for chunk_idx in range(total_chunks):
        # Determine strict start and end for this chunk
        start_mod = chunk_idx * CHUNK_SIZE + 1
        end_mod = min((chunk_idx + 1) * CHUNK_SIZE, module_count)
        current_chunk_size = end_mod - start_mod + 1
        
        print(f"Generating syllabus chunk {chunk_idx + 1}/{total_chunks} (Modules {start_mod}-{end_mod})...")
        
        prompt = prompts.SYLLABUS_PROMPT.format(
            charter=charter.model_dump(),
            count=current_chunk_size,
            sources=[s.model_dump() for s in sources],
        )
        
        # Add context about overall progress and previous modules
        prompt += f"\n\nCONTEXT: You are generating modules {start_mod} to {end_mod} of a {module_count}-module course."
        if previous_context:
            prompt += f"\nThe previous module was: {previous_context}"
            prompt += "\nCONTINUE the logical progression from there."
        
        if chunk_idx == total_chunks - 1:
            prompt += "\nThis is the FINAL chunk. Ensure the course concludes with advanced topics and a Capstone Project."
        
        prompt += "\n\nRespond with a valid JSON list of objects, where each object matches the Module schema (id, title, objectives, duration_minutes, dependencies, checkpoints)."
        
        try:
            response_text = llm.complete(prompt)
            data = llm.parse_json(response_text)
            
            if isinstance(data, list):
                for i, mod_data in enumerate(data):
                    # Calculate actual module number
                    mod_num = start_mod + i
                    # Ensure we don't exceed requested count even if LLM hallucinates extra
                    if mod_num > module_count:
                        break
                        
                    mod_id = mod_data.get("id") or f"module-{mod_num}"
                    
                    # Fix dependencies to look valid
                    deps = mod_data.get("dependencies", [])
                    if mod_num > 1 and not deps:
                        deps = [f"module-{mod_num-1}"]
                        
                    module = Module(
                        id=mod_id,
                        title=mod_data.get("title", f"Module {mod_num}"),
                        objectives=mod_data.get("objectives", ["Objective 1"]),
                        duration_minutes=mod_data.get("duration_minutes", 60),
                        dependencies=deps,
                        checkpoints=mod_data.get("checkpoints", ["Quiz"]),
                        references=sources[:2] 
                    )
                    modules.append(module)
                    
                # Update context for next chunk
                if modules:
                    last_mod = modules[-1]
                    previous_context = f"{last_mod.id}: {last_mod.title}"
            else:
                print(f"Chunk {chunk_idx+1} failed: Response was not a list.")
                
        except Exception as e:
            print(f"Error parsing syllabus chunk {chunk_idx+1}: {e}")
            # Fallback for this chunk ONLY
            for idx in range(start_mod, end_mod + 1):
                modules.append(
                    Module(
                        id=f"module-{idx}",
                        title=f"Module {idx}: Core Concept {idx} (Fallback)",
                        objectives=["Define core terms", "Apply concept"],
                        duration_minutes=60,
                        dependencies=[f"module-{idx-1}"] if idx > 1 else [],
                        checkpoints=["Quiz"],
                        references=sources[:2],
                    )
                )

    # Final validation of count
    return modules[:module_count]
