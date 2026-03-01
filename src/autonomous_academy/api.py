from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import Charter, Module, Lesson, SourceRef, Item
from autonomous_academy.services import content

app = FastAPI(title="Autonomous Academy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = LLMClient()

from enum import Enum

class AudienceLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"


class PrerequisitesRequest(BaseModel):
    topic: str
    audience_level: AudienceLevel = AudienceLevel.BEGINNER

@app.post("/api/generate-prerequisites", response_model=List[str])
async def generate_prerequisites_endpoint(request: PrerequisitesRequest):
    try:
        prereqs = content.generate_prerequisites(
            topic=request.topic,
            audience=request.audience_level.value,
            llm=llm
        )
        return prereqs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LessonGenerationRequest(BaseModel):
    module: Module
    course_topic: str
    audience: str
    tone: str = "supportive"

from fastapi.responses import FileResponse
from autonomous_academy.services import slides_service
import os

# Simple in-memory cache for slides to avoid re-generation
# Map module_id -> List[Slide]
slides_cache = {}

@app.post("/api/generate-lesson", response_model=Lesson)
async def generate_lesson_endpoint(request: LessonGenerationRequest):
    try:
        lesson = content.generate_module_content(
            module=request.module,
            course_topic=request.course_topic,
            audience=request.audience,
            tone=request.tone,
            llm=llm
        )
        # Cache slides for download
        if lesson.slides:
            slides_cache[request.module.id] = lesson.slides
            
        return lesson
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/download-slides/{module_id}")
async def download_slides(module_id: str):
    if module_id not in slides_cache:
        raise HTTPException(status_code=404, detail="Slides not found. Please generate lesson content first.")
    
    slides = slides_cache[module_id]
    filename = f"slides_{module_id}.pptx"
    filepath = os.path.join("/tmp", filename)
    
    try:
        # slides_service.generate_pptx(slides, filepath)
        
        # Use remote service for better quality
        # We need a topic/prompt. We'll use the title of the first slide or a fallback.
        topic = "Presentation"
        if slides and hasattr(slides[0], 'title'):
            topic = slides[0].title
            
        slides_service.generate_remote_pptx(topic, len(slides), filepath, slides_content=slides)
        
        return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
    except Exception as e:
        print(f"Remote generation failed: {e}. Falling back to local.")
        try:
             slides_service.generate_pptx(slides, filepath)
             return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
        except Exception as local_e:
             raise HTTPException(status_code=500, detail=f"Failed to generate PPTX: {str(e)} -> {str(local_e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PPTX: {str(e)}")

from autonomous_academy.schemas import Slide
import uuid

@app.post("/api/build-pptx")
async def build_pptx(slides: List[Slide]):
    if not slides:
        raise HTTPException(status_code=400, detail="Slide array cannot be empty.")
    
    temp_id = str(uuid.uuid4())[:8]
    filename = f"custom_presentation_{temp_id}.pptx"
    filepath = os.path.join("/tmp", filename)
    
    try:
        # Extract a decent topic name for remote service
        topic = slides[0].title if slides and slides[0].title else "Custom Presentation"
        
        # Build via Remote Service overriding the content
        slides_service.generate_remote_pptx(topic, len(slides), filepath, slides_content=slides)
        
        return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
    except Exception as e:
        print(f"Remote builder failed: {e}. Falling back to local generator.")
        try:
            slides_service.generate_pptx(slides, filepath)
            return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
        except Exception as local_e:
             raise HTTPException(status_code=500, detail=f"Failed to build PPTX: {str(e)} -> {str(local_e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}



# --- Tutor Endpoints ---
from autonomous_academy.services import tutor

class NarrateSlideRequest(BaseModel):
    courseTopic: str
    moduleLevel: str
    moduleObjectives: str
    slideTitle: str
    slideBullets: List[str]
    slideNotes: Optional[str] = None

@app.post("/api/tutor/narrate")
async def narrate_slide(request: NarrateSlideRequest):
    try:
        return tutor.narrate_slide(
            course_topic=request.courseTopic,
            module_level=request.moduleLevel,
            objectives=request.moduleObjectives,
            slide_title=request.slideTitle,
            slide_bullets=request.slideBullets,
            slide_notes=request.slideNotes,
            llm=llm
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TutorQARequest(BaseModel):
    courseTopic: str
    moduleLevel: str
    moduleObjectives: str
    slideContext: str
    question: str
    chatHistory: List[dict] = []
    mode: str = "local" # local, assess_or_answer, synthesize, local_fallback
    web_context: Optional[str] = None

from fastapi.responses import StreamingResponse

@app.post("/api/tutor/qa/stream")
async def tutor_qa_stream(request: TutorQARequest):
    try:
        # Return a StreamingResponse utilizing the generator in tutor
        generator = tutor.stream_answer_question(
            course_topic=request.courseTopic,
            module_level=request.moduleLevel,
            objectives=request.moduleObjectives,
            slide_context=request.slideContext,
            question=request.question,
            chat_history=request.chatHistory,
            mode=request.mode,
            web_context=request.web_context,
            llm=llm
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tutor/qa")
async def tutor_qa(request: TutorQARequest):
    try:
        return tutor.answer_question(
            course_topic=request.courseTopic,
            module_level=request.moduleLevel,
            objectives=request.moduleObjectives,
            slide_context=request.slideContext,
            question=request.question,
            chat_history=request.chatHistory,
            mode=request.mode,
            web_context=request.web_context,
            llm=llm
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
