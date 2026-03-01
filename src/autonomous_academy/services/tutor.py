import json
from typing import List
from ..llm import LLMClient

# System Prompts for Tutor
NARRATOR_PROMPT = """You are an engaging, supportive AI Teaching Assistant for an {level} course on '{course_topic}'.
Your goal is to narrate the current lecture slide to the student.

Module Objectives:
{objectives}

Current Slide: {slide_title}
Bullets:
{bullets}
Speaker Notes (if any):
{notes}

BEHAVIOR RULES:
- There is NO sentence limit. Explain the concepts clearly, define terms, and provide 1-2 practical examples that fit the {level} audience.
- Beginners need gentle, intuitive explanations. Advanced students need deeper technical details, tradeoffs, and pitfalls.
- Read through the bullets and notes, but narrate them naturally like a teacher speaking to a class. Do not just read the bullets verbatim.
- You may end with a single "Check your understanding" conceptual question.
- If the slide has an interactive mini-website, you MUST trigger visual animations simultaneously while you narrate by outputting `<Action entityId="<id>" action="highlight"/>` directly inline in your markdown output. For example: "As you can see on the <Action entityId="diagram-1" action="highlight"/> diagram here..."
- Format your response clearly in Markdown.

Respond ONLY with a valid JSON object matching this schema:
{{
    "answer": "The full narrated text in markdown."
}}
"""

QA_MODE_ASSESS = """You are an AI Teaching Assistant for an {level} course on '{course_topic}'.
Analyze the following input. It may be a student's question or a system directive.

Input: {question}

Rule 1: If the question asks for latest news, modern examples, current papers, real-world tools, OR if it's completely outside the course context, you MUST flag that web search is needed.
Rule 2: If the question can be completely answered using the module context and slide context, do not use web search.

Respond ONLY with a valid JSON object matching this schema:
{{
    "needs_web_search": true or false,
    "search_query": "if true, provide a good search engine query to find the answer. if false, leave empty."
}}
"""

QA_MODE_LOCAL_STREAM = """You are a highly knowledgeable peer discussing an {level} course on '{course_topic}'.
Address the following input using ONLY the provided course/slide context. It may be a student question or a proactive teaching directive.

Context:
{context}

Input: {question}

BEHAVIOR RULES:
- Speak completely naturally. DO NOT adopt a cheesy "teacher persona" (e.g. NEVER say "Let's dive in", "Imagine you are", or "Welcome back").
- Keep your answers relatively short and punchy.
- Avoid monologues. Explain clearly, then ask a follow-up question to involve them.
- If the current slide has a rich interactive website, you should NOT generate new Artifacts. Instead, you MUST trigger visual animations on the existing website by outputting `<Action entityId="<id>" action="highlight"/>` directly inline in your markdown output. For example: "As you can see on the <Action entityId="diagram-1" action="highlight"/> diagram here..."
- DO NOT wrap your answer in JSON. Respond directly in Markdown.
"""

QA_MODE_DIAGNOSTIC = """You are conducting an interactive diagnostic pre-assessment for a {level} course on '{course_topic}'.
Your goal is to gauge the student's prior knowledge before they start learning.

Context:
{context}

Input: {question}

BEHAVIOR RULES:
- Speak naturally and casually. DO NOT use generic AI enthusiasm ("Great job!", "Let's dive in!").
- If this is the start of the conversation, ask a single targeted question to gauge their existing knowledge.
- If they are answering a question, evaluate it directly and casually, then ask the next logical question.
- Keep your responses short and engaging. DO NOT lecture. Only ask ONE question at a time.
- DO NOT wrap your answer in JSON. Respond directly in Markdown.
"""

QA_MODE_SYNTHESIZE_STREAM = """You are a highly knowledgeable peer discussing an {level} course on '{course_topic}'.
Address the following input, synthesizing both course context and web search results.

Course Context:
{context}

Web Search Results:
{web_context}

Input: {question}

BEHAVIOR RULES:
- Read both the course context and the web search results.
- Speak completely naturally. DO NOT adopt a cheesy "teacher persona" (e.g. NEVER say "Let's dive in", "Imagine you are", or "Welcome back").
- You MUST explicitly cite your web sources inline using markdown links [Source Title](https://...).
- Keep the response relatively short and conversational. End with an engaging question to involve the student.
- If the current slide has a rich interactive website, you should NOT generate new Artifacts. Instead, you MUST trigger visual animations on the existing website by outputting `<Action entityId="<id>" action="highlight"/>` directly inline in your markdown output. For example: "As you can see on the <Action entityId="diagram-1" action="highlight"/> diagram here..."
- DO NOT wrap your response in JSON. Respond directly in Markdown.
"""

def narrate_slide(course_topic: str, module_level: str, objectives: str, slide_title: str, slide_bullets: List[str], slide_notes: str, llm: LLMClient):
    prompt = NARRATOR_PROMPT.format(
        course_topic=course_topic,
        level=module_level,
        objectives=objectives,
        slide_title=slide_title,
        bullets="\n".join([f"- {b}" for b in slide_bullets]),
        notes=slide_notes or "None"
    )
    
    response = llm.complete(prompt)
    try:
        data = llm.parse_json(response)
        return data
    except Exception as e:
        print(f"Error parsing narrate JSON: {e}")
        return {"answer": response}

def answer_question(course_topic: str, module_level: str, objectives: str, slide_context: str, question: str, chat_history: List[dict], mode: str, web_context: str, llm: LLMClient):
    
    if mode == "assess_or_answer":
        prompt = QA_MODE_ASSESS.format(
            course_topic=course_topic,
            level=module_level,
            question=question
        )
        response = llm.complete(prompt)
        try:
            return llm.parse_json(response)
        except Exception:
            return {"needs_web_search": False, "answer": response}
            
    elif mode == "synthesize":
        prompt = QA_MODE_SYNTHESIZE.format(
            course_topic=course_topic,
            level=module_level,
            context=slide_context,
            web_context=web_context,
            question=question
        )
        response = llm.complete(prompt)
        try:
             return llm.parse_json(response)
        except Exception:
             return {"answer": response, "citations": []}
             
    else: # local or local_fallback
        full_context = slide_context
        if web_context:
            full_context += f"\n\nSystem Note regarding Web Search: {web_context}"
            
        prompt = QA_MODE_LOCAL_STREAM.format(
            course_topic=course_topic,
            level=module_level,
            context=full_context,
            question=question
        )
        response = llm.complete(prompt)
        try:
            return llm.parse_json(response)
        except Exception:
            return {"answer": response}

def stream_answer_question(course_topic: str, module_level: str, objectives: str, slide_context: str, question: str, chat_history: List[dict], mode: str, web_context: str, llm: LLMClient):
    
    # We only stream the final synthesis or local answering phases.
    # Assess mode still returns a JSON object sync.
    if mode == "assess_or_answer":
        prompt = QA_MODE_ASSESS.format(
            course_topic=course_topic,
            level=module_level,
            question=question
        )
        response = llm.complete(prompt)
        try:
            yield json.dumps(llm.parse_json(response))
        except Exception:
            yield json.dumps({"needs_web_search": False})
            
    elif mode == "synthesize":
        prompt = QA_MODE_SYNTHESIZE_STREAM.format(
            course_topic=course_topic,
            level=module_level,
            context=slide_context,
            web_context=web_context,
            question=question
        )
        for chunk in llm.stream_complete(prompt):
            yield chunk

    elif mode == "diagnostic":
        prompt = QA_MODE_DIAGNOSTIC.format(
            course_topic=course_topic,
            level=module_level,
            context=slide_context, # Can be empty or contain chat history
            question=question
        )
        for chunk in llm.stream_complete(prompt):
            yield chunk
             
    else: # local or local_fallback
        full_context = slide_context
        if web_context:
            full_context += f"\n\nSystem Note regarding Web Search: {web_context}"
            
        prompt = QA_MODE_LOCAL_STREAM.format(
            course_topic=course_topic,
            level=module_level,
            context=full_context,
            question=question
        )
        for chunk in llm.stream_complete(prompt):
            yield chunk
